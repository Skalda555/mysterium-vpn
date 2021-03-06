/*
 * Copyright (C) 2017 The "mysteriumnetwork/mysterium-vpn" Authors.
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

import messages from '../messages'
import type { SyncReceiver } from './sync'
import type { SyncMainCommunication } from './sync-communication'
import type { SerializedLogCaches } from '../../logging/log-cache-bundle'
import type { LogDTO, MetricDto } from '../dto'
import type { RavenData } from '../../bug-reporting/metrics/metrics'

class SyncReceiverMainCommunication implements SyncMainCommunication {
  _syncReceiver: SyncReceiver

  constructor (syncReceiver: SyncReceiver) {
    this._syncReceiver = syncReceiver
  }

  onGetSerializedCaches (callback: () => SerializedLogCaches): void {
    this._on(messages.GET_SERIALIZED_CACHES, callback)
  }

  onSendMetric (callback: MetricDto => void): void {
    this._on(messages.SEND_METRIC, callback)
  }

  onGetMetrics (callback: () => RavenData): void {
    this._on(messages.GET_METRICS, callback)
  }

  onLog (callback: (LogDTO) => void): void {
    this._on(messages.LOG, callback)
  }

  _on (channel: string, callback: (data: any) => mixed) {
    this._syncReceiver.on(channel, callback)
  }
}

export default SyncReceiverMainCommunication
