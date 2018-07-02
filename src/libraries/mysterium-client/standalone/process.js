/*
 * Copyright (C) 2017 The "MysteriumNetwork/mysterion" Authors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// @flow

import { spawn, ChildProcess } from 'child_process'
import { Readable } from 'stream'
import type { ClientConfig } from '../config'
import type { ProcessInterface } from '../index'
import logLevels from '../log-levels'

type LogCallback = (data: any) => any

/**
 * 'mysterium_client' process handler
 */
class Process implements ProcessInterface {
  _config: ClientConfig
  _child: ChildProcess

  /**
   * @constructor
   *
   * @param {ClientConfig} config
   */
  constructor (config: ClientConfig) {
    this._config = config
  }

  async start (): Promise<void> {
    this._child = spawn(this._config.clientBin, [
      '--config-dir', this._config.configDir,
      '--runtime-dir', this._config.runtimeDir,
      '--openvpn.binary', this._config.openVPNBin,
      '--tequilapi.port', this._config.tequilapiPort.toString()
    ])
  }

  async stop (): Promise<void> {
    this._child.kill('SIGTERM')
  }

  /**
   * Registers a callback for a specific log level
   *
   * @param {string} level
   * @param {LogCallback} cb
   */
  onLog (level: string, cb: LogCallback): void {
    this._getStreamForLevel(level).on('data', (data) => {
      cb(data.toString())
    })
  }

  async setupLogging (): Promise<void> {

  }

  /**
   * Returns child process output stream based on log level
   *
   * @param {string} level
   *
   * @return {Readable}
   *
   * @private
   */
  _getStreamForLevel (level: string): Readable {
    switch (level) {
      case logLevels.INFO:
        return this._child.stdout
      case logLevels.ERROR:
        return this._child.stderr
      default:
        throw new Error(`Unknown logging level: ${level}`)
    }
  }
}

export default Process
