//
//  ChatListener.swift
//  cosmokit CLI
//
//  CHAT-08: cosmokit chat listen — long-poll for Agent window messages
//  and answer them automatically using local Claude CLI.
//

import Foundation
import Darwin

public struct ChatListenOptions {
    public var isNewSession: Bool
    public var model: String?
    public var allowEdits: Bool
    public var timeout: TimeInterval
    public var agent: String?
    public var isJSON: Bool
    public var workingDir: String
    public var mcpConfigPath: String?

    public init(
        isNewSession: Bool = false,
        model: String? = nil,
        allowEdits: Bool = false,
        timeout: TimeInterval = 600,
        agent: String? = nil,
        isJSON: Bool = false,
        workingDir: String = FileManager.default.currentDirectoryPath,
        mcpConfigPath: String? = nil
    ) {
        self.isNewSession = isNewSession
        self.model = model
        self.allowEdits = allowEdits
        self.timeout = timeout
        self.agent = agent
        self.isJSON = isJSON
        self.workingDir = workingDir
        self.mcpConfigPath = mcpConfigPath
    }
}

public enum SupportedAgent: String, CaseIterable {
    case claude
    case codex
    case cursor

    public static func from(raw: String) -> SupportedAgent? {
        switch raw.lowercased() {
        case "claude": return .claude
        case "codex": return .codex
        case "cursor", "cursor-agent": return .cursor
        default: return nil
        }
    }

    public var clientName: String {
        "\(rawValue)-listen"
    }

    public var executableName: String {
        switch self {
        case .claude: return "claude"
        case .codex: return "codex"
        case .cursor: return "cursor-agent"
        }
    }
}

public struct AgentResolution: Equatable {
    public let agent: SupportedAgent
    public let source: String
    public let executablePath: String

    public init(agent: SupportedAgent, source: String, executablePath: String) {
        self.agent = agent
        self.source = source
        self.executablePath = executablePath
    }
}

public struct AgentTurnResult {
    public let reply: String
    public let sessionID: String?
    public let numTurns: Int?
    public let durationMs: Int?
    public let denials: [String]
    public let isError: Bool
    public let rawError: String?

    public init(
        reply: String,
        sessionID: String?,
        numTurns: Int? = nil,
        durationMs: Int? = nil,
        denials: [String] = [],
        isError: Bool = false,
        rawError: String? = nil
    ) {
        self.reply = reply
        self.sessionID = sessionID
        self.numTurns = numTurns
        self.durationMs = durationMs
        self.denials = denials
        self.isError = isError
        self.rawError = rawError
    }
}

public protocol AgentTurnRunner: AnyObject {
    func runTurn(prompt: String, sessionID: String?, options: ChatListenOptions) throws -> AgentTurnResult
    func terminateActiveProcess()
}

public extension AgentTurnRunner {
    func terminateActiveProcess() {}
}

public final class SessionStore {
    public var directoryURL: URL

    public init(directoryURL: URL? = nil) {
        if let directoryURL {
            self.directoryURL = directoryURL
        } else {
            self.directoryURL = FileManager.default.homeDirectoryForCurrentUser
                .appendingPathComponent("Library/Application Support/cosmokit/sessions", isDirectory: true)
        }
    }

    public func loadSessionID(for threadID: UUID) -> String? {
        let file = directoryURL.appendingPathComponent("\(threadID.uuidString).json")
        guard let data = try? Data(contentsOf: file),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let sessionID = json["sessionId"] as? String, !sessionID.isEmpty else {
            return nil
        }
        return sessionID
    }

    public func saveSessionID(_ sessionID: String, for threadID: UUID) {
        try? FileManager.default.createDirectory(at: directoryURL, withIntermediateDirectories: true)
        let file = directoryURL.appendingPathComponent("\(threadID.uuidString).json")
        let payload: [String: Any] = [
            "threadId": threadID.uuidString,
            "sessionId": sessionID,
            "updatedAt": ISO8601DateFormatter().string(from: Date())
        ]
        if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys, .prettyPrinted]) {
            try? data.write(to: file, options: .atomic)
        }
    }

    public func clearSessionID(for threadID: UUID) {
        let file = directoryURL.appendingPathComponent("\(threadID.uuidString).json")
        try? FileManager.default.removeItem(at: file)
    }
}

public final class ClaudeTurnRunner: AgentTurnRunner {
    public static var activeProcess: Process?
    private static let lock = NSLock()

    public static func setActiveProcess(_ proc: Process?) {
        lock.lock()
        activeProcess = proc
        lock.unlock()
    }

    public static func terminateActiveProcess() {
        lock.lock()
        defer { lock.unlock() }
        if let proc = activeProcess, proc.isRunning {
            proc.terminate()
            Thread.sleep(forTimeInterval: 0.2)
            if proc.isRunning {
                kill(proc.processIdentifier, SIGKILL)
            }
        }
        activeProcess = nil
    }

    public func terminateActiveProcess() {
        Self.terminateActiveProcess()
    }

    public var executablePath: String?

    public static var defaultExecutableFinder: () -> String? = {
        let fileManager = FileManager.default
        let envPath = ProcessInfo.processInfo.environment["PATH"] ?? ""
        var dirs = envPath.split(separator: ":").map(String.init)
        let home = fileManager.homeDirectoryForCurrentUser.path
        let common = [
            "\(home)/.local/bin",
            "/opt/homebrew/bin",
            "/usr/local/bin",
            "/usr/bin",
            "/bin"
        ]
        for dir in common where !dirs.contains(dir) {
            dirs.append(dir)
        }
        for dir in dirs {
            let candidate = (dir as NSString).appendingPathComponent("claude")
            if fileManager.isExecutableFile(atPath: candidate) {
                return candidate
            }
        }
        return nil
    }

    public var executableFinder: () -> String? = ClaudeTurnRunner.defaultExecutableFinder

    public var processRunner: (_ executable: String, _ arguments: [String], _ timeout: TimeInterval) throws -> (stdout: String, stderr: String, exitCode: Int32, timedOut: Bool) = { executable, arguments, timeout in
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = arguments
        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        process.standardOutput = stdoutPipe
        process.standardError = stderrPipe

        var env = ProcessInfo.processInfo.environment
        env["COSMOKIT_CHAT"] = "off"
        process.environment = env

        try process.run()
        ClaudeTurnRunner.setActiveProcess(process)
        defer { ClaudeTurnRunner.setActiveProcess(nil) }

        let stdoutHandle = stdoutPipe.fileHandleForReading
        let stderrHandle = stderrPipe.fileHandleForReading

        var stdoutData = Data()
        var stderrData = Data()
        let group = DispatchGroup()

        group.enter()
        DispatchQueue.global(qos: .userInitiated).async {
            stdoutData = stdoutHandle.readDataToEndOfFile()
            group.leave()
        }

        group.enter()
        DispatchQueue.global(qos: .userInitiated).async {
            stderrData = stderrHandle.readDataToEndOfFile()
            group.leave()
        }

        let deadline = Date().addingTimeInterval(timeout)
        var timedOut = false
        while process.isRunning {
            if Date() > deadline {
                timedOut = true
                process.terminate()
                Thread.sleep(forTimeInterval: 0.5)
                if process.isRunning {
                    kill(process.processIdentifier, SIGKILL)
                }
                break
            }
            Thread.sleep(forTimeInterval: 0.05)
        }
        process.waitUntilExit()
        _ = group.wait(timeout: .now() + 2.0)

        let stdoutStr = String(data: stdoutData, encoding: .utf8) ?? ""
        let stderrStr = String(data: stderrData, encoding: .utf8) ?? ""
        return (stdoutStr, stderrStr, process.terminationStatus, timedOut)
    }

    public init(executablePath: String? = nil) {
        self.executablePath = executablePath
    }

    public func buildArguments(prompt: String, sessionID: String?, options: ChatListenOptions, mcpConfigPath: String) -> [String] {
        var args = [
            "-p", prompt,
            "--output-format", "json",
            "--strict-mcp-config",
            "--mcp-config", mcpConfigPath
        ]

        let allowedTools: String
        if options.allowEdits {
            allowedTools = "mcp__cosmokit__*,Read,Grep,Glob,Edit,Write,Bash"
            args += ["--allowedTools", allowedTools, "--permission-mode", "acceptEdits"]
        } else {
            allowedTools = "mcp__cosmokit__*,Read,Grep,Glob"
            args += ["--allowedTools", allowedTools]
        }

        if let model = options.model, !model.isEmpty {
            args += ["--model", model]
        }

        args += [
            "--append-system-prompt",
            "You are answering messages sent by a developer in the CosmoKit Agent window. Be concise and direct. If simulator context or screenshots are provided, inspect them with your tools."
        ]

        if let sessionID, !sessionID.isEmpty {
            args += ["--resume", sessionID]
        }

        return args
    }

    public func runTurn(prompt: String, sessionID: String?, options: ChatListenOptions) throws -> AgentTurnResult {
        guard let executable = executablePath ?? executableFinder() else {
            return AgentTurnResult(
                reply: "Could not find 'claude' CLI on PATH. Make sure Claude Code is installed (https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) and available in your PATH.",
                sessionID: sessionID,
                isError: true,
                rawError: "claude not found on PATH"
            )
        }

        guard let mcpConfigPath = options.mcpConfigPath else {
            return AgentTurnResult(
                reply: "Internal error: MCP configuration file is missing.",
                sessionID: sessionID,
                isError: true,
                rawError: "missing mcp config"
            )
        }

        let args = buildArguments(prompt: prompt, sessionID: sessionID, options: options, mcpConfigPath: mcpConfigPath)
        let outcome = try processRunner(executable, args, options.timeout)

        if outcome.timedOut {
            return AgentTurnResult(
                reply: "Claude turn timed out after \(Int(options.timeout)) seconds.",
                sessionID: sessionID,
                isError: true,
                rawError: "turn timed out"
            )
        }

        // Check if resume failed because the session no longer exists
        if outcome.exitCode != 0 && sessionID != nil {
            let combined = outcome.stdout + " " + outcome.stderr
            if isSessionNotFoundError(combined) {
                // Retry once without --resume
                let freshOptions = options
                let freshArgs = buildArguments(prompt: prompt, sessionID: nil, options: freshOptions, mcpConfigPath: mcpConfigPath)
                let freshOutcome = try processRunner(executable, freshArgs, options.timeout)
                if freshOutcome.exitCode == 0, let parsed = parseOutput(freshOutcome.stdout, fallbackSessionID: nil) {
                    let prefixedReply = "Previous session expired or could not be resumed. Started a new session.\n\n\(parsed.reply)"
                    return AgentTurnResult(
                        reply: prefixedReply,
                        sessionID: parsed.sessionID,
                        numTurns: parsed.numTurns,
                        durationMs: parsed.durationMs,
                        denials: parsed.denials,
                        isError: false
                    )
                }
            }
        }

        // Check for login error in stdout/stderr
        let combined = outcome.stdout + " " + outcome.stderr
        if isLoginError(combined) {
            return AgentTurnResult(
                reply: "Claude is not logged in. Run 'claude' once in your terminal to log in, then try again.",
                sessionID: sessionID,
                isError: true,
                rawError: "not logged in"
            )
        }

        // Parse JSON output if present
        if let parsed = parseOutput(outcome.stdout, fallbackSessionID: sessionID) {
            if parsed.isError && isLoginError(parsed.reply) {
                return AgentTurnResult(
                    reply: "Claude is not logged in. Run 'claude' once in your terminal to log in, then try again.",
                    sessionID: parsed.sessionID,
                    isError: true,
                    rawError: "not logged in"
                )
            }
            return parsed
        }

        // Exit was non-zero and no JSON could be parsed
        if outcome.exitCode != 0 {
            let errorText = outcome.stderr.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                ? outcome.stdout.trimmingCharacters(in: .whitespacesAndNewlines)
                : outcome.stderr.trimmingCharacters(in: .whitespacesAndNewlines)
            let display = errorText.isEmpty ? "exit status \(outcome.exitCode)" : errorText
            let truncated = display.count > 500 ? String(display.prefix(500)) + "..." : display
            return AgentTurnResult(
                reply: "Claude failed with error: \(truncated)",
                sessionID: sessionID,
                isError: true,
                rawError: display
            )
        }

        // Invalid JSON on stdout
        let stdoutTrimmed = outcome.stdout.trimmingCharacters(in: .whitespacesAndNewlines)
        let snippet = stdoutTrimmed.count > 500 ? String(stdoutTrimmed.prefix(500)) + "..." : stdoutTrimmed
        return AgentTurnResult(
            reply: "Claude produced invalid output: \(snippet.isEmpty ? "(empty stdout)" : snippet)",
            sessionID: sessionID,
            isError: true,
            rawError: "invalid JSON on stdout"
        )
    }

    private func isSessionNotFoundError(_ text: String) -> Bool {
        text.contains("No conversation found with session ID") ||
        text.contains("No session found with ID") ||
        (text.contains("session") && text.contains("not found")) ||
        text.contains("Could not resume session")
    }

    private func isLoginError(_ text: String) -> Bool {
        text.contains("Not logged in") ||
        text.contains("Please run /login") ||
        text.contains("run `claude` to log in") ||
        text.contains("Authentication error") ||
        text.contains("auth_error")
    }

    private func parseOutput(_ stdout: String, fallbackSessionID: String?) -> AgentTurnResult? {
        guard let data = stdout.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }

        let isError = json["is_error"] as? Bool ?? false
        let sessionID = (json["session_id"] as? String) ?? fallbackSessionID
        let numTurns = json["num_turns"] as? Int
        let durationMs = (json["duration_ms"] as? NSNumber)?.intValue
        var rawResult = json["result"] as? String ?? ""

        var denials: [String] = []
        if let rawDenials = json["permission_denials"] as? [Any] {
            for item in rawDenials {
                if let str = item as? String {
                    denials.append(str)
                } else if let dict = item as? [String: Any] {
                    if let toolName = dict["tool_name"] as? String ?? dict["tool"] as? String {
                        denials.append(toolName)
                    }
                }
            }
        }

        if !denials.isEmpty {
            rawResult += "\n\n(Tool call was denied: \(denials.joined(separator: ", ")). Run with --allow-edits to permit file modifications.)"
        }

        // Cap message at 20,000 characters
        if rawResult.count > 20_000 {
            let note = "\n\n[truncated: output exceeded 20,000 characters]"
            let maxLen = max(0, 20_000 - note.count)
            rawResult = String(rawResult.prefix(maxLen)) + note
        }

        return AgentTurnResult(
            reply: rawResult,
            sessionID: sessionID,
            numTurns: numTurns,
            durationMs: durationMs,
            denials: denials,
            isError: isError,
            rawError: isError ? rawResult : nil
        )
    }
}

public final class CodexTurnRunner: AgentTurnRunner {
    public static var activeProcess: Process?
    private static let lock = NSLock()

    public static func setActiveProcess(_ proc: Process?) {
        lock.lock()
        activeProcess = proc
        lock.unlock()
    }

    public static func terminateActiveProcess() {
        lock.lock()
        defer { lock.unlock() }
        if let proc = activeProcess, proc.isRunning {
            proc.terminate()
            Thread.sleep(forTimeInterval: 0.2)
            if proc.isRunning {
                kill(proc.processIdentifier, SIGKILL)
            }
        }
        activeProcess = nil
    }

    public func terminateActiveProcess() {
        Self.terminateActiveProcess()
    }

    public var executablePath: String?
    public var cosmokitPath: String?
    public var executableFinder: () -> String? = {
        ChatListener.findExecutable(named: "codex")
    }

    public var processRunner: (_ executable: String, _ arguments: [String], _ timeout: TimeInterval) throws -> (stdout: String, stderr: String, exitCode: Int32, timedOut: Bool) = { executable, arguments, timeout in
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = arguments
        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        process.standardOutput = stdoutPipe
        process.standardError = stderrPipe

        var env = ProcessInfo.processInfo.environment
        env["COSMOKIT_CHAT"] = "off"
        process.environment = env

        try process.run()
        CodexTurnRunner.setActiveProcess(process)
        defer { CodexTurnRunner.setActiveProcess(nil) }

        let stdoutHandle = stdoutPipe.fileHandleForReading
        let stderrHandle = stderrPipe.fileHandleForReading

        var stdoutData = Data()
        var stderrData = Data()
        let group = DispatchGroup()

        group.enter()
        DispatchQueue.global(qos: .userInitiated).async {
            stdoutData = stdoutHandle.readDataToEndOfFile()
            group.leave()
        }

        group.enter()
        DispatchQueue.global(qos: .userInitiated).async {
            stderrData = stderrHandle.readDataToEndOfFile()
            group.leave()
        }

        let deadline = Date().addingTimeInterval(timeout)
        var timedOut = false
        while process.isRunning {
            if Date() > deadline {
                timedOut = true
                process.terminate()
                Thread.sleep(forTimeInterval: 0.5)
                if process.isRunning {
                    kill(process.processIdentifier, SIGKILL)
                }
                break
            }
            Thread.sleep(forTimeInterval: 0.05)
        }
        process.waitUntilExit()
        _ = group.wait(timeout: .now() + 2.0)

        let stdoutStr = String(data: stdoutData, encoding: .utf8) ?? ""
        let stderrStr = String(data: stderrData, encoding: .utf8) ?? ""
        return (stdoutStr, stderrStr, process.terminationStatus, timedOut)
    }

    public init(executablePath: String? = nil, cosmokitPath: String? = nil) {
        self.executablePath = executablePath
        self.cosmokitPath = cosmokitPath
    }

    public func buildArguments(
        prompt: String,
        sessionID: String?,
        options: ChatListenOptions,
        outputFilePath: String,
        cosmokitBinary: String
    ) -> [String] {
        var args: [String] = []
        if let sessionID = sessionID, !sessionID.isEmpty {
            args = ["exec", "resume", sessionID, prompt, "--skip-git-repo-check"]
        } else {
            let sandbox = options.allowEdits ? "workspace-write" : "read-only"
            args = ["exec", "--skip-git-repo-check", "-s", sandbox, "-C", options.workingDir]
        }

        if let model = options.model, !model.isEmpty {
            args += ["-m", model]
        }

        args += [
            "--json",
            "-o", outputFilePath,
            "-c", "mcp_servers.cosmokit.command=\"\(cosmokitBinary)\"",
            "-c", "mcp_servers.cosmokit.args=[\"mcp\"]",
            "-c", "mcp_servers.cosmokit.env.COSMOKIT_CHAT=\"off\""
        ]

        if sessionID == nil || sessionID!.isEmpty {
            args.append(prompt)
        }

        return args
    }

    public func runTurn(prompt: String, sessionID: String?, options: ChatListenOptions) throws -> AgentTurnResult {
        guard let executable = executablePath ?? executableFinder() else {
            return AgentTurnResult(
                reply: "Could not find 'codex' CLI on PATH. Make sure Codex CLI is installed and available in your PATH.",
                sessionID: sessionID,
                isError: true,
                rawError: "codex not found on PATH"
            )
        }

        let tempDir = FileManager.default.temporaryDirectory
            .appendingPathComponent("cosmokit-codex-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: tempDir) }
        let lastMsgFile = tempDir.appendingPathComponent("last_message.txt")

        let bin = cosmokitPath ?? ChatListener.resolveCosmokitBinaryPath()
        let args = buildArguments(prompt: prompt, sessionID: sessionID, options: options, outputFilePath: lastMsgFile.path, cosmokitBinary: bin)
        let outcome = try processRunner(executable, args, options.timeout)

        if outcome.timedOut {
            return AgentTurnResult(
                reply: "Codex turn timed out after \(Int(options.timeout)) seconds.",
                sessionID: sessionID,
                isError: true,
                rawError: "turn timed out"
            )
        }

        let combined = outcome.stdout + " " + outcome.stderr

        // Check if resume failed because the session no longer exists
        if outcome.exitCode != 0 && sessionID != nil {
            if isSessionNotFoundError(combined) {
                let freshArgs = buildArguments(prompt: prompt, sessionID: nil, options: options, outputFilePath: lastMsgFile.path, cosmokitBinary: bin)
                let freshOutcome = try processRunner(executable, freshArgs, options.timeout)
                if freshOutcome.exitCode == 0, let parsed = parseOutput(stdout: freshOutcome.stdout, outputFile: lastMsgFile, fallbackSessionID: nil) {
                    let prefixedReply = "Previous session expired or could not be resumed. Started a new session.\n\n\(parsed.reply)"
                    return AgentTurnResult(
                        reply: prefixedReply,
                        sessionID: parsed.sessionID,
                        numTurns: parsed.numTurns,
                        durationMs: parsed.durationMs,
                        denials: parsed.denials,
                        isError: false
                    )
                }
            }
        }

        // Check for login error
        if isLoginError(combined) {
            return AgentTurnResult(
                reply: "Codex is not logged in. Run 'codex' once in your terminal to log in, then try again.",
                sessionID: sessionID,
                isError: true,
                rawError: "not logged in"
            )
        }

        // Parse output
        if let parsed = parseOutput(stdout: outcome.stdout, outputFile: lastMsgFile, fallbackSessionID: sessionID) {
            if parsed.isError && isLoginError(parsed.reply) {
                return AgentTurnResult(
                    reply: "Codex is not logged in. Run 'codex' once in your terminal to log in, then try again.",
                    sessionID: parsed.sessionID,
                    isError: true,
                    rawError: "not logged in"
                )
            }
            if outcome.exitCode == 0 || !parsed.reply.isEmpty {
                return parsed
            }
        }

        // Exit was non-zero
        if outcome.exitCode != 0 {
            let errorText = outcome.stderr.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                ? outcome.stdout.trimmingCharacters(in: .whitespacesAndNewlines)
                : outcome.stderr.trimmingCharacters(in: .whitespacesAndNewlines)
            let display = errorText.isEmpty ? "exit status \(outcome.exitCode)" : errorText
            let truncated = display.count > 500 ? String(display.prefix(500)) + "..." : display
            return AgentTurnResult(
                reply: "Codex failed with error: \(truncated)",
                sessionID: sessionID,
                isError: true,
                rawError: display
            )
        }

        return AgentTurnResult(
            reply: "Codex produced no output.",
            sessionID: sessionID,
            isError: true,
            rawError: "empty output"
        )
    }

    private func isSessionNotFoundError(_ text: String) -> Bool {
        text.contains("no rollout found") ||
        text.contains("thread/resume failed") ||
        text.contains("No session found") ||
        (text.contains("session") && text.contains("not found"))
    }

    private func isLoginError(_ text: String) -> Bool {
        text.contains("Not logged in") ||
        text.contains("Please log in") ||
        text.contains("run `codex` to log in") ||
        text.contains("Unauthorized") ||
        text.contains("authentication")
    }

    public func parseOutput(stdout: String, outputFile: URL, fallbackSessionID: String?) -> AgentTurnResult? {
        var replyText = ""
        if let fileData = try? Data(contentsOf: outputFile),
           let text = String(data: fileData, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines),
           !text.isEmpty {
            replyText = text
        }

        var sessionID: String? = fallbackSessionID
        var turnsCount = 0
        let lines = stdout.split(separator: "\n")
        for line in lines {
            guard let lineData = line.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: lineData) as? [String: Any] else {
                continue
            }
            let type = json["type"] as? String ?? ""
            if type == "thread.started", let tid = json["thread_id"] as? String {
                sessionID = tid
            } else if type == "turn.completed" {
                turnsCount += 1
            } else if replyText.isEmpty && type == "item.completed" {
                if let item = json["item"] as? [String: Any],
                   let itemType = item["type"] as? String,
                   itemType == "agent_message",
                   let text = item["text"] as? String {
                    replyText = text
                }
            }
        }

        if replyText.isEmpty && sessionID == nil {
            return nil
        }

        if replyText.count > 20_000 {
            let note = "\n\n[truncated: output exceeded 20,000 characters]"
            let maxLen = max(0, 20_000 - note.count)
            replyText = String(replyText.prefix(maxLen)) + note
        }

        return AgentTurnResult(
            reply: replyText,
            sessionID: sessionID,
            numTurns: max(1, turnsCount),
            isError: false
        )
    }
}

public final class CursorTurnRunner: AgentTurnRunner {
    public static var activeProcess: Process?
    private static let lock = NSLock()

    public static func setActiveProcess(_ proc: Process?) {
        lock.lock()
        activeProcess = proc
        lock.unlock()
    }

    public static func terminateActiveProcess() {
        lock.lock()
        defer { lock.unlock() }
        if let proc = activeProcess, proc.isRunning {
            proc.terminate()
            Thread.sleep(forTimeInterval: 0.2)
            if proc.isRunning {
                kill(proc.processIdentifier, SIGKILL)
            }
        }
        activeProcess = nil
    }

    public func terminateActiveProcess() {
        Self.terminateActiveProcess()
    }

    public var executablePath: String?
    public var executableFinder: () -> String? = {
        ChatListener.findExecutable(named: "cursor-agent")
    }

    public var processRunner: (_ executable: String, _ arguments: [String], _ timeout: TimeInterval) throws -> (stdout: String, stderr: String, exitCode: Int32, timedOut: Bool) = { executable, arguments, timeout in
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = arguments
        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        process.standardOutput = stdoutPipe
        process.standardError = stderrPipe

        var env = ProcessInfo.processInfo.environment
        env["COSMOKIT_CHAT"] = "off"
        process.environment = env

        try process.run()
        CursorTurnRunner.setActiveProcess(process)
        defer { CursorTurnRunner.setActiveProcess(nil) }

        let stdoutHandle = stdoutPipe.fileHandleForReading
        let stderrHandle = stderrPipe.fileHandleForReading

        var stdoutData = Data()
        var stderrData = Data()
        let group = DispatchGroup()

        group.enter()
        DispatchQueue.global(qos: .userInitiated).async {
            stdoutData = stdoutHandle.readDataToEndOfFile()
            group.leave()
        }

        group.enter()
        DispatchQueue.global(qos: .userInitiated).async {
            stderrData = stderrHandle.readDataToEndOfFile()
            group.leave()
        }

        let deadline = Date().addingTimeInterval(timeout)
        var timedOut = false
        while process.isRunning {
            if Date() > deadline {
                timedOut = true
                process.terminate()
                Thread.sleep(forTimeInterval: 0.5)
                if process.isRunning {
                    kill(process.processIdentifier, SIGKILL)
                }
                break
            }
            Thread.sleep(forTimeInterval: 0.05)
        }
        process.waitUntilExit()
        _ = group.wait(timeout: .now() + 2.0)

        let stdoutStr = String(data: stdoutData, encoding: .utf8) ?? ""
        let stderrStr = String(data: stderrData, encoding: .utf8) ?? ""
        return (stdoutStr, stderrStr, process.terminationStatus, timedOut)
    }

    public init(executablePath: String? = nil) {
        self.executablePath = executablePath
    }

    public func buildArguments(
        prompt: String,
        sessionID: String?,
        options: ChatListenOptions
    ) -> [String] {
        var args = [
            "-p", prompt,
            "--output-format", "json",
            "--trust",
            "--approve-mcps",
            "--workspace", options.workingDir
        ]

        if options.allowEdits {
            args += ["-f"]
        } else {
            args += ["--mode", "ask"]
        }

        if let model = options.model, !model.isEmpty {
            args += ["--model", model]
        }

        if let sessionID = sessionID, !sessionID.isEmpty {
            args += ["--resume", sessionID]
        }

        return args
    }

    public func runTurn(prompt: String, sessionID: String?, options: ChatListenOptions) throws -> AgentTurnResult {
        guard let executable = executablePath ?? executableFinder() else {
            return AgentTurnResult(
                reply: "Could not find 'cursor-agent' CLI on PATH. Make sure Cursor Agent is installed and available in your PATH.",
                sessionID: sessionID,
                isError: true,
                rawError: "cursor-agent not found on PATH"
            )
        }

        let args = buildArguments(prompt: prompt, sessionID: sessionID, options: options)
        let outcome = try processRunner(executable, args, options.timeout)

        if outcome.timedOut {
            return AgentTurnResult(
                reply: "Cursor turn timed out after \(Int(options.timeout)) seconds.",
                sessionID: sessionID,
                isError: true,
                rawError: "turn timed out"
            )
        }

        let combined = outcome.stdout + " " + outcome.stderr

        // Check if resume failed because the session no longer exists
        if outcome.exitCode != 0 && sessionID != nil {
            if isSessionNotFoundError(combined) {
                let freshArgs = buildArguments(prompt: prompt, sessionID: nil, options: options)
                let freshOutcome = try processRunner(executable, freshArgs, options.timeout)
                if freshOutcome.exitCode == 0, let parsed = parseOutput(freshOutcome.stdout, fallbackSessionID: nil) {
                    let prefixedReply = "Previous session expired or could not be resumed. Started a new session.\n\n\(parsed.reply)"
                    return AgentTurnResult(
                        reply: prefixedReply,
                        sessionID: parsed.sessionID,
                        numTurns: parsed.numTurns,
                        durationMs: parsed.durationMs,
                        denials: parsed.denials,
                        isError: false
                    )
                }
            }
        }

        // Check for login error
        if isLoginError(combined) {
            return AgentTurnResult(
                reply: "Cursor is not logged in. Run 'cursor-agent' once in your terminal to log in, then try again.",
                sessionID: sessionID,
                isError: true,
                rawError: "not logged in"
            )
        }

        // Parse JSON output if present
        if let parsed = parseOutput(outcome.stdout, fallbackSessionID: sessionID) {
            if parsed.isError && isLoginError(parsed.reply) {
                return AgentTurnResult(
                    reply: "Cursor is not logged in. Run 'cursor-agent' once in your terminal to log in, then try again.",
                    sessionID: parsed.sessionID,
                    isError: true,
                    rawError: "not logged in"
                )
            }
            if outcome.exitCode == 0 || !parsed.reply.isEmpty {
                return parsed
            }
        }

        // Exit was non-zero
        if outcome.exitCode != 0 {
            let errorText = outcome.stderr.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                ? outcome.stdout.trimmingCharacters(in: .whitespacesAndNewlines)
                : outcome.stderr.trimmingCharacters(in: .whitespacesAndNewlines)
            let display = errorText.isEmpty ? "exit status \(outcome.exitCode)" : errorText
            let truncated = display.count > 500 ? String(display.prefix(500)) + "..." : display
            return AgentTurnResult(
                reply: "Cursor failed with error: \(truncated)",
                sessionID: sessionID,
                isError: true,
                rawError: display
            )
        }

        let stdoutTrimmed = outcome.stdout.trimmingCharacters(in: .whitespacesAndNewlines)
        let snippet = stdoutTrimmed.count > 500 ? String(stdoutTrimmed.prefix(500)) + "..." : stdoutTrimmed
        return AgentTurnResult(
            reply: "Cursor produced invalid output: \(snippet.isEmpty ? "(empty stdout)" : snippet)",
            sessionID: sessionID,
            isError: true,
            rawError: "invalid JSON on stdout"
        )
    }

    private func isSessionNotFoundError(_ text: String) -> Bool {
        text.contains("Session not found") ||
        text.contains("Could not find session") ||
        text.contains("no session found")
    }

    private func isLoginError(_ text: String) -> Bool {
        text.contains("Not logged in") ||
        text.contains("Please log in") ||
        text.contains("run `cursor-agent` to log in") ||
        text.contains("Unauthorized") ||
        text.contains("authentication")
    }

    public func parseOutput(_ stdout: String, fallbackSessionID: String?) -> AgentTurnResult? {
        guard let data = stdout.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }

        let isError = json["is_error"] as? Bool ?? false
        let sessionID = (json["session_id"] as? String) ?? fallbackSessionID
        let durationMs = (json["duration_ms"] as? NSNumber)?.intValue
        var rawResult = json["result"] as? String ?? ""

        if rawResult.count > 20_000 {
            let note = "\n\n[truncated: output exceeded 20,000 characters]"
            let maxLen = max(0, 20_000 - note.count)
            rawResult = String(rawResult.prefix(maxLen)) + note
        }

        return AgentTurnResult(
            reply: rawResult,
            sessionID: sessionID,
            numTurns: 1,
            durationMs: durationMs,
            denials: [],
            isError: isError,
            rawError: isError ? rawResult : nil
        )
    }
}

public enum ChatListener {
    public static var activeTempDir: URL?
    public static var activeRunner: AgentTurnRunner?
    private static let cleanupLock = NSLock()
    private static var isCleaningUp = false

    public static func registerCleanup(tempDir: URL) {
        cleanupLock.lock()
        activeTempDir = tempDir
        cleanupLock.unlock()
    }

    public static func cleanupTempDir() {
        cleanupLock.lock()
        defer { cleanupLock.unlock() }
        if let dir = activeTempDir {
            try? FileManager.default.removeItem(at: dir)
            activeTempDir = nil
        }
    }

    public static func setupSignalHandlers() {
        signal(SIGINT, SIG_IGN)
        signal(SIGTERM, SIG_IGN)

        let sigintSource = DispatchSource.makeSignalSource(signal: SIGINT, queue: .main)
        sigintSource.setEventHandler {
            cleanupAndExit()
        }
        sigintSource.resume()

        let sigtermSource = DispatchSource.makeSignalSource(signal: SIGTERM, queue: .main)
        sigtermSource.setEventHandler {
            cleanupAndExit()
        }
        sigtermSource.resume()
    }

    public static func cleanupAndExit() {
        cleanupLock.lock()
        if isCleaningUp {
            cleanupLock.unlock()
            return
        }
        isCleaningUp = true
        cleanupLock.unlock()

        activeRunner?.terminateActiveProcess()
        ClaudeTurnRunner.terminateActiveProcess()
        CodexTurnRunner.terminateActiveProcess()
        CursorTurnRunner.terminateActiveProcess()
        cleanupTempDir()
        exit(0)
    }

    public static func resolveCosmokitBinaryPath(customPath: String? = nil) -> String {
        if let customPath {
            return customPath
        } else if let exec = Bundle.main.executablePath, exec.hasSuffix("cosmokit") {
            return exec
        } else {
            let arg0 = CommandLine.arguments[0]
            if arg0.hasPrefix("/") {
                return arg0
            } else {
                return URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
                    .appendingPathComponent(arg0).standardized.path
            }
        }
    }

    public static func findExecutable(
        named name: String,
        fileManager: FileManager = .default,
        environment: [String: String] = ProcessInfo.processInfo.environment
    ) -> String? {
        let envPath = environment["PATH"] ?? ""
        var dirs = envPath.split(separator: ":").map(String.init)
        let home = fileManager.homeDirectoryForCurrentUser.path
        let common = [
            "\(home)/.local/bin",
            "/opt/homebrew/bin",
            "/usr/local/bin",
            "/usr/bin",
            "/bin"
        ]
        for dir in common where !dirs.contains(dir) {
            dirs.append(dir)
        }
        for dir in dirs {
            let candidate = (dir as NSString).appendingPathComponent(name)
            if fileManager.isExecutableFile(atPath: candidate) {
                return candidate
            }
        }
        return nil
    }

    public static func resolveAgent(
        requested: String?,
        environment: [String: String] = ProcessInfo.processInfo.environment,
        fileManager: FileManager = .default
    ) throws -> AgentResolution {
        // 1. Explicit flag
        if let requested = requested, !requested.isEmpty {
            guard let agent = SupportedAgent.from(raw: requested) else {
                throw CLIError(commandError: CommandError(
                    code: .usage,
                    message: "unsupported agent '\(requested)'. Supported agents: claude, codex, cursor."
                ))
            }
            guard let path = findExecutable(named: agent.executableName, fileManager: fileManager, environment: environment) else {
                throw CLIError(commandError: CommandError(
                    code: .unsupported,
                    message: "Could not find '\(agent.executableName)' on PATH.",
                    hint: "Install \(agent.rawValue) or ensure its binary is in your PATH."
                ))
            }
            return AgentResolution(agent: agent, source: "flag", executablePath: path)
        }

        // 2. COSMOKIT_AGENT env
        if let envAgent = environment["COSMOKIT_AGENT"], !envAgent.isEmpty {
            guard let agent = SupportedAgent.from(raw: envAgent) else {
                throw CLIError(commandError: CommandError(
                    code: .usage,
                    message: "unsupported agent in COSMOKIT_AGENT: '\(envAgent)'. Supported agents: claude, codex, cursor."
                ))
            }
            guard let path = findExecutable(named: agent.executableName, fileManager: fileManager, environment: environment) else {
                throw CLIError(commandError: CommandError(
                    code: .unsupported,
                    message: "Could not find '\(agent.executableName)' on PATH (specified via COSMOKIT_AGENT).",
                    hint: "Install \(agent.rawValue) or ensure its binary is in your PATH."
                ))
            }
            return AgentResolution(agent: agent, source: "COSMOKIT_AGENT", executablePath: path)
        }

        // 3. Search PATH in order: claude, codex, cursor-agent
        let searchOrder: [SupportedAgent] = [.claude, .codex, .cursor]
        for agent in searchOrder {
            if let path = findExecutable(named: agent.executableName, fileManager: fileManager, environment: environment) {
                return AgentResolution(agent: agent, source: "PATH", executablePath: path)
            }
        }

        throw CLIError(commandError: CommandError(
            code: .unsupported,
            message: "No supported agent CLI found on PATH (checked: claude, codex, cursor-agent).",
            hint: "Install Claude Code (https://docs.anthropic.com/en/docs/agents-and-tools/claude-code), Codex CLI, or Cursor Agent (https://cursor.com), or specify an agent with --agent <claude|codex|cursor>."
        ))
    }

    public static func isCursorMCPConfigured(workingDir: String, fileManager: FileManager = .default) -> Bool {
        let candidatePaths = [
            URL(fileURLWithPath: workingDir).appendingPathComponent(".cursor/mcp.json"),
            fileManager.homeDirectoryForCurrentUser.appendingPathComponent(".cursor/mcp.json")
        ]
        for url in candidatePaths {
            guard let data = try? Data(contentsOf: url),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                continue
            }
            if let servers = json["mcpServers"] as? [String: Any], servers["cosmokit"] != nil {
                return true
            }
        }
        return false
    }

    public static func createTempMCPConfig(cosmokitPath: String? = nil) throws -> (tempDir: URL, configFile: URL) {
        let tempDir = FileManager.default.temporaryDirectory
            .appendingPathComponent("cosmokit-chat-listen-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
        let configFile = tempDir.appendingPathComponent("mcp-config.json")

        let binaryPath = resolveCosmokitBinaryPath(customPath: cosmokitPath)

        let config: [String: Any] = [
            "mcpServers": [
                "cosmokit": [
                    "command": binaryPath,
                    "args": ["mcp"],
                    "env": [
                        "COSMOKIT_CHAT": "off"
                    ]
                ]
            ]
        ]

        let data = try JSONSerialization.data(withJSONObject: config, options: [.prettyPrinted, .sortedKeys])
        try data.write(to: configFile)
        registerCleanup(tempDir: tempDir)
        return (tempDir, configFile)
    }

    public static func formatPrompt(messages: [ChatMessageWire]) -> String {
        messages.map { msg in
            var parts: [String] = []
            if let context = msg.context, !context.isEmpty {
                var ctxLines: [String] = []
                if let udid = context["udid"], !udid.isEmpty { ctxLines.append("Simulator UDID: \(udid)") }
                if let bundleId = context["bundleId"], !bundleId.isEmpty { ctxLines.append("Bundle ID: \(bundleId)") }
                if let path = context["screenshotPath"], !path.isEmpty { ctxLines.append("Screenshot: \(path)") }
                if !ctxLines.isEmpty {
                    parts.append("[Simulator Context]\n" + ctxLines.joined(separator: "\n"))
                }
            }
            parts.append(msg.text)
            return parts.joined(separator: "\n\n")
        }.joined(separator: "\n\n---\n\n")
    }

    public static func verifyAppVersion() throws {
        let controlInfo = try AppControl.readControlInfo()
        if AppControl.isVersion(controlInfo.version, olderThan: "4.9.0") {
            throw CLIError(commandError: CommandError(
                code: .appTooOld,
                message: "CosmoKit version \(controlInfo.version) is too old for chat listen",
                hint: "CosmoKit 4.9.0 or newer is required (found \(controlInfo.version))"
            ))
        }
    }

    public static func start(
        options: ChatListenOptions,
        runner: AgentTurnRunner? = nil,
        chatClient: ChatClient? = nil,
        sessionStore: SessionStore = SessionStore()
    ) throws {
        setvbuf(stdout, nil, _IOLBF, 0)
        setupSignalHandlers()

        let resolution: AgentResolution
        let effectiveRunner: AgentTurnRunner

        if let explicitRunner = runner {
            effectiveRunner = explicitRunner
            let agent = SupportedAgent.from(raw: options.agent ?? "claude") ?? .claude
            resolution = AgentResolution(agent: agent, source: options.agent != nil ? "flag" : "runner", executablePath: "")
        } else {
            let res = try resolveAgent(requested: options.agent)
            resolution = res
            switch res.agent {
            case .claude:
                effectiveRunner = ClaudeTurnRunner(executablePath: res.executablePath)
            case .codex:
                effectiveRunner = CodexTurnRunner(executablePath: res.executablePath)
            case .cursor:
                effectiveRunner = CursorTurnRunner(executablePath: res.executablePath)
            }
        }
        activeRunner = effectiveRunner

        var effectiveOptions = options
        effectiveOptions.agent = resolution.agent.rawValue
        var tempDirToRemove: URL?

        if resolution.agent == .claude && effectiveOptions.mcpConfigPath == nil {
            let (tempDir, configFile) = try createTempMCPConfig()
            effectiveOptions.mcpConfigPath = configFile.path
            tempDirToRemove = tempDir
        }
        defer {
            if let tempDirToRemove {
                try? FileManager.default.removeItem(at: tempDirToRemove)
            }
        }

        let client = chatClient ?? ChatClient(clientName: resolution.agent.clientName, workingDir: effectiveOptions.workingDir)

        // Cursor MCP check: warn if not configured
        if resolution.agent == .cursor && !isCursorMCPConfigured(workingDir: effectiveOptions.workingDir) {
            if options.isJSON {
                emitJSON([
                    "event": "warning",
                    "message": "CosmoKit MCP server is not configured in ~/.cursor/mcp.json or .cursor/mcp.json. Simulator control tools will not be available."
                ])
            } else {
                print("""
                Warning: CosmoKit MCP server is not configured in ~/.cursor/mcp.json or .cursor/mcp.json.
                Simulator control tools will not be available to Cursor until added:
                {
                  "mcpServers": {
                    "cosmokit": {
                      "command": "cosmokit",
                      "args": ["mcp"]
                    }
                  }
                }
                """)
            }
        }

        // Wait for CosmoKit app if not running or too old
        var printedWaitingMessage = false
        var threadID: UUID!

        while threadID == nil {
            do {
                if chatClient == nil || AppControl.controlFileURLOverride != nil {
                    try verifyAppVersion()
                }
                try client.registerIfNeeded()
                if let id = client.currentThreadID {
                    threadID = id
                }
            } catch let error as CLIError where error.commandError.code == .appNotRunning || error.commandError.code == .appTooOld {
                if !printedWaitingMessage {
                    if options.isJSON {
                        emitJSON(["event": "waiting", "message": error.commandError.message])
                    } else {
                        print("Waiting for CosmoKit: \(error.commandError.message)")
                    }
                    printedWaitingMessage = true
                }
                Thread.sleep(forTimeInterval: 5.0)
            } catch {
                let nsError = error as NSError
                if nsError.domain == NSURLErrorDomain || nsError.domain == NSPOSIXErrorDomain {
                    if !printedWaitingMessage {
                        if options.isJSON {
                            emitJSON(["event": "waiting", "message": "CosmoKit is not reachable"])
                        } else {
                            print("Waiting for CosmoKit to become available...")
                        }
                        printedWaitingMessage = true
                    }
                    Thread.sleep(forTimeInterval: 5.0)
                } else {
                    throw error
                }
            }
        }

        // Start heartbeat timer
        let heartbeatQueue = DispatchQueue(label: "com.cosmokit.chat-listen.heartbeat")
        let heartbeatTimer = DispatchSource.makeTimerSource(queue: heartbeatQueue)
        heartbeatTimer.schedule(deadline: .now() + 15, repeating: 20.0)
        heartbeatTimer.setEventHandler { [weak client] in
            _ = try? client?.heartbeat()
        }
        heartbeatTimer.resume()
        defer {
            heartbeatTimer.cancel()
        }

        // Resolve session ID
        var currentSessionID: String?
        if options.isNewSession {
            sessionStore.clearSessionID(for: threadID)
            currentSessionID = nil
        } else {
            currentSessionID = sessionStore.loadSessionID(for: threadID)
        }

        // Startup terminal output
        let toolSummary = options.allowEdits ? "simulator + edits allowed" : "simulator + read-only"
        let threadPrefix = String(threadID.uuidString.prefix(8))
        let sessionSummary = currentSessionID.map { "session \($0)" } ?? "new session"
        let agentSummary = "\(resolution.agent.rawValue) (\(resolution.source))"

        if options.isJSON {
            var startPayload: [String: Any] = [
                "event": "start",
                "agent": resolution.agent.rawValue,
                "agentSource": resolution.source,
                "threadId": threadID.uuidString,
                "session": currentSessionID == nil ? "new" : "resumed",
                "tools": toolSummary
            ]
            if let sid = currentSessionID { startPayload["sessionId"] = sid }
            emitJSON(startPayload)
        } else {
            print("cosmokit chat listen: agent \(agentSummary), thread \(threadPrefix), \(sessionSummary), tools: \(toolSummary)")
        }

        // Long-poll loop
        while true {
            let messages: [ChatMessageWire]
            do {
                messages = try client.read(wait: 25)
            } catch let error as CLIError where error.commandError.code == .appNotRunning || error.commandError.code == .appTooOld {
                if options.isJSON {
                    emitJSON(["event": "waiting", "message": error.commandError.message])
                } else {
                    print("Waiting for CosmoKit: \(error.commandError.message)")
                }
                Thread.sleep(forTimeInterval: 5.0)
                continue
            } catch {
                Thread.sleep(forTimeInterval: 2.0)
                continue
            }

            guard !messages.isEmpty else { continue }

            // Log received event
            let firstText = messages.first?.text ?? ""
            let preview = firstText.prefix(80).replacingOccurrences(of: "\n", with: " ")
            if options.isJSON {
                emitJSON([
                    "event": "message",
                    "id": messages.first?.id.uuidString ?? "",
                    "from": "human",
                    "count": messages.count,
                    "text": firstText
                ])
            } else {
                print("[received] \(preview)")
            }

            // Build prompt & run turn
            let prompt = formatPrompt(messages: messages)
            let startTime = Date()

            let turnResult: AgentTurnResult
            do {
                turnResult = try effectiveRunner.runTurn(prompt: prompt, sessionID: currentSessionID, options: effectiveOptions)
            } catch {
                turnResult = AgentTurnResult(
                    reply: "Error executing agent turn: \(error.localizedDescription)",
                    sessionID: currentSessionID,
                    isError: true,
                    rawError: error.localizedDescription
                )
            }

            let elapsedSeconds = Date().timeIntervalSince(startTime)

            // Update session ID if available
            if let newSessionID = turnResult.sessionID, !newSessionID.isEmpty {
                currentSessionID = newSessionID
                sessionStore.saveSessionID(newSessionID, for: threadID)
            }

            // Post reply back to CosmoKit
            _ = try? client.reply(turnResult.reply)

            // Log reply event
            let replyPreview = turnResult.reply.prefix(80).replacingOccurrences(of: "\n", with: " ")
            let turnsCount = turnResult.numTurns ?? 1
            if options.isJSON {
                var replyPayload: [String: Any] = [
                    "event": "reply",
                    "durationSec": Double(round(elapsedSeconds * 10) / 10),
                    "turns": turnsCount,
                    "text": turnResult.reply,
                    "isError": turnResult.isError
                ]
                if let sid = currentSessionID { replyPayload["sessionId"] = sid }
                emitJSON(replyPayload)
            } else {
                let timingStr = String(format: "%.1fs", elapsedSeconds)
                let turnStr = turnsCount == 1 ? "1 turn" : "\(turnsCount) turns"
                print("[replied] in \(timingStr) (\(turnStr)): \(replyPreview)")
            }
        }
    }

    private static func emitJSON(_ object: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys]) else { return }
        if let line = String(data: data, encoding: .utf8) {
            print(line)
            fflush(stdout)
        }
    }
}
