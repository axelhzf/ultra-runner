import chalk from "chalk"
import { spawn } from "child_process"

export class Spawner {
  output = ""
  buffer = ""

  onData = (data: string) => {
    data
  }

  onLine = (line: string) => {
    line
  }

  onError = (error: Error) => {
    return error
  }

  onExit = (code: number) => {
    return new Error(`Exit code ${code}`)
  }

  constructor(public cmd: string, public args: string[]) {}

  spawn(raw = false) {
    const child = spawn(this.cmd, this.args, {
      env: { ...process.env, FORCE_COLOR: `${chalk.level}` },
      stdio: raw ? "inherit" : "pipe",
    })

    return new Promise((resolve, reject) => {
      child.stdout?.on("data", data => this.processData(data))
      child.stderr?.on("data", data => this.processData(data))
      child.on("error", err => {
        reject(this.onError(err))
      })
      child.on("exit", code => {
        if (this.buffer.length) this.onLine(`${this.buffer}\n`)
        this.buffer = ""
        if (code) reject(this.onExit(code))
        else resolve()
      })
    })
  }

  processData(data: string) {
    data = `${data}`
    this.output += data
    let chunk = `${data}`
    let nl
    while ((nl = chunk.indexOf("\n")) >= 0) {
      const line = this.buffer + chunk.slice(0, nl)
      this.buffer = ""
      chunk = chunk.slice(nl + 1)
      this.onLine(line)
    }
    this.buffer = chunk
    this.onData(data)
  }
}
