import XCTest
@testable import CosmoKitCLI

final class StreamFeedbackTests: XCTestCase {
    override func tearDown() {
        FeedbackStore.baseDirectoryOverride = nil
        super.tearDown()
    }

    func testFeedbackLineRendersUnder600Bytes() throws {
        let element = FeedbackElementPayload(
            ref: 7,
            type: "Button",
            label: "Continue",
            identifier: "cta.continue",
            frame: UITreeFrame(x: 187, y: 612, width: 280, height: 44)
        )
        let record = FeedbackRecordPayload(
            seq: 3,
            at: "2026-09-08T15:00:00Z",
            x: 187,
            y: 612,
            element: element,
            text: "This should be disabled until the form is valid",
            frame: "/Users/developer/Library/Application Support/cosmokit/feedback/SIM-UDID-12345/3.png",
            branch: "feat/x",
            worktree: "/Users/developer/Projects/CosmoKit",
            app: "com.example.app",
            udid: "SIM-UDID-12345",
            acked: false
        )

        let line = FeedbackStore.formatCompact(record)
        let byteCount = Data(line.utf8).count

        XCTAssertLessThanOrEqual(byteCount, 600, "Feedback line should be under 600 bytes, was \(byteCount)")
        XCTAssertTrue(line.contains("#3 on [7] Button \"Continue\" (id: cta.continue) at (187,612) — \"This should be disabled until the form is valid\""))
        XCTAssertTrue(line.contains("branch: feat/x"))
    }

    func testPostFeedbackWithoutTokenPathIsRejectedWith404() throws {
        let validToken = "a1b2c3d4e5f6"
        let payload = #"{"x": 100, "y": 200, "text": "Hello agent"}"#.data(using: .utf8)

        // 1. Without any token prefix
        let res1 = StreamServer.processRequest(
            method: "POST",
            uri: "/feedback",
            body: payload,
            token: validToken,
            udid: "TEST-UDID"
        )
        XCTAssertEqual(res1.statusCode, 404)

        // 2. With wrong token
        let res2 = StreamServer.processRequest(
            method: "POST",
            uri: "/s/wrongtoken123/feedback",
            body: payload,
            token: validToken,
            udid: "TEST-UDID"
        )
        XCTAssertEqual(res2.statusCode, 404)

        // 3. With valid token
        let res3 = StreamServer.processRequest(
            method: "POST",
            uri: "/s/\(validToken)/feedback",
            body: payload,
            token: validToken,
            udid: "TEST-UDID"
        )
        XCTAssertEqual(res3.statusCode, 200)
    }

    func testPointToElementResolutionPicksDeepestContainerFreeMatch() throws {
        // Construct hierarchy:
        // Window (container, 0,0 400x800) -> depth 0
        //   ScrollView (container, 0,50 400x700) -> depth 1
        //     Other (container, 10,60 380x600) -> depth 2
        //       StaticText "Header" (10,60 200x30) -> depth 3
        //       Button "Submit" (10,120 200x50, ref 42) -> depth 3
        //         LayoutItem (container inside button, 10,120 200x50) -> depth 4
        let innerContainer = UIElement(
            ref: 43,
            type: "LayoutItem",
            frame: UITreeFrame(x: 10, y: 120, width: 200, height: 50)
        )
        let button = UIElement(
            ref: 42,
            type: "Button",
            identifier: "btn.submit",
            label: "Submit",
            frame: UITreeFrame(x: 10, y: 120, width: 200, height: 50),
            children: [innerContainer]
        )
        let header = UIElement(
            ref: 10,
            type: "StaticText",
            label: "Header",
            frame: UITreeFrame(x: 10, y: 60, width: 200, height: 30)
        )
        let otherView = UIElement(
            ref: 5,
            type: "Other",
            frame: UITreeFrame(x: 10, y: 60, width: 380, height: 600),
            children: [header, button]
        )
        let scrollView = UIElement(
            ref: 2,
            type: "ScrollView",
            frame: UITreeFrame(x: 0, y: 50, width: 400, height: 700),
            children: [otherView]
        )
        let window = UIElement(
            ref: 1,
            type: "Window",
            frame: UITreeFrame(x: 0, y: 0, width: 400, height: 800),
            children: [scrollView]
        )
        let snapshot = UISnapshot(app: "com.example.app", elements: [window])

        // Tap point inside button (x: 50, y: 140)
        let resolved = FeedbackStore.resolveElement(in: snapshot, x: 50, y: 140)

        XCTAssertNotNil(resolved)
        XCTAssertEqual(resolved?.ref, 42)
        XCTAssertEqual(resolved?.type, "Button")
        XCTAssertEqual(resolved?.label, "Submit")
    }

    func testFeedbackStoreCRUD() throws {
        let tempDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        FeedbackStore.baseDirectoryOverride = tempDir
        defer { try? FileManager.default.removeItem(at: tempDir) }

        let udid = "SIM-TEST-CRUD"
        let elem = FeedbackElementPayload(ref: 1, type: "Button", label: "OK")

        let rec1 = try FeedbackStore.append(
            udid: udid, x: 10, y: 20, element: elem, text: "First comment",
            framePath: "/tmp/1.png", branch: "main", worktree: "/repo", app: "com.app"
        )
        XCTAssertEqual(rec1.seq, 1)
        XCTAssertEqual(rec1.acked, false)

        let rec2 = try FeedbackStore.append(
            udid: udid, x: 30, y: 40, element: elem, text: "Second comment",
            framePath: "/tmp/2.png", branch: "main", worktree: "/repo", app: "com.app"
        )
        XCTAssertEqual(rec2.seq, 2)

        let all = FeedbackStore.readAll(udid: udid)
        XCTAssertEqual(all.count, 2)

        let acked1 = try FeedbackStore.ack(udid: udid, seq: 1)
        XCTAssertEqual(acked1?.acked, true)

        let nextUnread = FeedbackStore.nextUnread(udid: udid, wait: 0)
        XCTAssertEqual(nextUnread?.seq, 2)

        let cleared = try FeedbackStore.clear(udid: udid)
        XCTAssertEqual(cleared, 2)
        XCTAssertEqual(FeedbackStore.readAll(udid: udid).count, 0)
    }

    func testMCPInvocationForAgentStreamAndFeedback() throws {
        // agent_stream start
        let inv1 = try MCPServer.commandInvocation(tool: "agent_stream", arguments: ["port": 9000, "device": "iPhone"])
        XCTAssertEqual(inv1.command, "agent")
        XCTAssertEqual(inv1.args, ["stream", "--daemon", "iPhone", "--port", "9000"])

        // agent_stream stop
        let inv2 = try MCPServer.commandInvocation(tool: "agent_stream", arguments: ["action": "stop", "device": "iPhone"])
        XCTAssertEqual(inv2.command, "agent")
        XCTAssertEqual(inv2.args, ["stream", "stop", "iPhone"])

        // feedback next
        let inv3 = try MCPServer.commandInvocation(tool: "feedback", arguments: ["action": "next", "wait": 10])
        XCTAssertEqual(inv3.command, "feedback")
        XCTAssertEqual(inv3.args, ["next", "--wait", "10"])

        // feedback ack
        let inv4 = try MCPServer.commandInvocation(tool: "feedback", arguments: ["action": "ack", "seq": 5])
        XCTAssertEqual(inv4.command, "feedback")
        XCTAssertEqual(inv4.args, ["ack", "5"])
    }
}
