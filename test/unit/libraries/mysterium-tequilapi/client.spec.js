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

import HttpTequilapiClient from '../../../../src/libraries/mysterium-tequilapi/client'
import IdentityDTO from '../../../../src/libraries/mysterium-tequilapi/dto/identity'
import ProposalDTO from '../../../../src/libraries/mysterium-tequilapi/dto/proposal'
import AxiosAdapter from '../../../../src/libraries/mysterium-tequilapi/adapters/axios-adapter'
import axios from 'axios/index'
import MockAdapter from 'axios-mock-adapter'
import {capturePromiseError} from '../../../helpers/utils'
import NodeHealthcheckDTO from '../../../../src/libraries/mysterium-tequilapi/dto/node-healthcheck'
import ConnectionStatisticsDTO from '../../../../src/libraries/mysterium-tequilapi/dto/connection-statistics'
import ConnectionIPDTO from '../../../../src/libraries/mysterium-tequilapi/dto/connection-ip'
import ConnectionStatusDTO from '../../../../src/libraries/mysterium-tequilapi/dto/connection-status'
import ConnectionRequestDTO from '../../../../src/libraries/mysterium-tequilapi/dto/connection-request'

describe('HttpTequilapiClient', () => {
  let api
  let mock
  beforeEach(() => {
    const axioInstance = axios.create()
    api = new HttpTequilapiClient(new AxiosAdapter(axioInstance), 1)
    mock = new MockAdapter(axioInstance)
  })

  describe('healthcheck()', () => {
    it('returns response', async () => {
      const response = {
        uptime: '1h10m',
        process: 1111,
        version: {
          commit: '0bcccc',
          branch: 'master',
          buildNumber: '001'
        }
      }
      mock.onGet('healthcheck').reply(200, response)

      const healthcheck = await api.healthCheck()
      expect(healthcheck).to.deep.equal(new NodeHealthcheckDTO(response))
    })

    it('handles error', async () => {
      mock.onGet('/healthcheck').reply(500)

      const e = await capturePromiseError(api.healthCheck())
      expect(e.message).to.equal('Request failed with status code 500')
    })
  })

  describe('stop()', () => {
    it('success', async () => {
      const expectedRequest = undefined
      mock.onPost('stop', expectedRequest).reply(200)

      const response = await api.stop()
      expect(response).to.be.undefined
    })

    it('handles error', async () => {
      mock.onPost('stop').reply(500)

      const e = await capturePromiseError(api.stop())
      expect(e.message).to.equal('Request failed with status code 500')
    })
  })

  describe('findProposals()', () => {
    it('returns proposal DTOs', async () => {
      const response = {
        proposals: [{
          id: 1,
          providerId: '0x0',
          serviceType: 'openvpn',
          serviceDefinition: {
            locationOriginate: {
              asn: '',
              country: 'NL'
            }
          }
        }, {
          id: 1,
          providerId: '0x1',
          serviceType: 'openvpn',
          serviceDefinition: {
            locationOriginate: {
              asn: '',
              country: 'LT'
            }
          }
        }]
      }
      mock.onGet('proposals').reply(200, response)

      const proposals = await api.findProposals()
      expect(proposals).to.have.lengthOf(2)
      expect(proposals[0]).to.deep.equal(new ProposalDTO(response.proposals[0]))
      expect(proposals[1]).to.deep.equal(new ProposalDTO(response.proposals[1]))
    })

    it('handles error', async () => {
      mock.onGet('proposals').reply(500)

      const e = await capturePromiseError(api.findProposals())
      expect(e.message).to.equal('Request failed with status code 500')
    })
  })

  describe('identitiesList()', () => {
    it('returns identity DTOs', async () => {
      const response = [
        {id: '0x1000FACE'},
        {id: '0x2000FACE'}
      ]
      mock.onGet('identities').reply(200, response)

      const identities = await api.identitiesList()
      expect(identities).to.have.lengthOf(2)
      expect(identities[0]).to.deep.equal(new IdentityDTO(response[0]))
      expect(identities[1]).to.deep.equal(new IdentityDTO(response[1]))
    })

    it('handles error', async () => {
      mock.onGet('identities').reply(500)

      const e = await capturePromiseError(api.identitiesList())
      expect(e.message).to.equal('Request failed with status code 500')
    })
  })

  describe('identityCreate()', () => {
    it('create identity', async () => {
      const response = {id: '0x0000bEEF'}
      mock.onPost('identities', {passphrase: 'test'}).reply(200, response)

      const identity = await api.identityCreate('test')
      expect(identity).to.deep.equal(new IdentityDTO(response))
    })

    it('handles error', async () => {
      mock.onPost('identities').reply(500)

      const e = await capturePromiseError(api.identityCreate('test'))
      expect(e.message).to.equal('Request failed with status code 500')
    })
  })

  describe('identityUnlock()', () => {
    it('create identity', async () => {
      mock.onPut('identities/0x0000bEEF/unlock', {passphrase: 'test'}).reply(200)

      const identity = await api.identityUnlock('0x0000bEEF', 'test')
      expect(identity).to.be.undefined
    })

    it('handles error', async () => {
      mock.onPut('identities/0x0000bEEF/unlock').reply(500)

      const e = await capturePromiseError(api.identityUnlock('0x0000bEEF', 'test'))
      expect(e.message).to.equal('Request failed with status code 500')
    })
  })

  describe('connectionCreate()', () => {
    it('returns response', async () => {
      const expectedRequest = {
        consumerId: '0x1000FACE',
        providerId: '0x2000FACE'
      }
      const response = {
        status: 'Connected',
        sessionId: 'My-super-session'
      }
      mock.onPut('connection', expectedRequest).reply(200, response)

      const stats = await api.connectionCreate(new ConnectionRequestDTO('0x1000FACE', '0x2000FACE'))
      expect(stats).to.deep.equal(new ConnectionStatusDTO(response))
    })

    it('handles error', async () => {
      mock.onPut('connection').reply(500)

      const e = await capturePromiseError(api.connectionCreate(new ConnectionRequestDTO()))
      expect(e.message).to.equal('Request failed with status code 500')
    })
  })

  describe('connectionStatus()', () => {
    it('returns response', async () => {
      const response = {
        status: 'Connected',
        sessionId: 'My-super-session'
      }
      mock.onGet('connection').reply(200, response)

      const connection = await api.connectionStatus()
      expect(connection).to.deep.equal(new ConnectionStatusDTO(response))
    })

    it('handles error', async () => {
      mock.onGet('connection').reply(500)

      const e = await capturePromiseError(api.connectionStatus())
      expect(e.message).to.equal('Request failed with status code 500')
    })
  })

  describe('connectionCancel()', () => {
    it('returns response', async () => {
      const expectedRequest = undefined
      const response = {
        status: 'NotConnected',
        sessionId: ''
      }
      mock.onDelete('connection', expectedRequest).reply(200, response)

      const connection = await api.connectionCancel()
      expect(connection).to.deep.equal(new ConnectionStatusDTO(response))
    })

    it('handles error', async () => {
      mock.onDelete('connection').reply(500)

      const e = await capturePromiseError(api.connectionCancel())
      expect(e.message).to.equal('Request failed with status code 500')
    })
  })

  describe('connectionIP()', () => {
    it('returns response', async () => {
      const response = {ip: 'mock ip'}
      mock.onGet('connection/ip').reply(200, response)

      const stats = await api.connectionIP()
      expect(stats).to.deep.equal(new ConnectionIPDTO(response))
    })

    it('handles error', async () => {
      mock.onGet('connection/ip').reply(500)

      const e = await capturePromiseError(api.connectionIP())
      expect(e.message).to.equal('Request failed with status code 500')
    })
  })

  describe('connectionStatistics()', () => {
    it('returns response', async () => {
      const response = {
        duration: 13325,
        bytesReceived: 1232133, // 1.17505 MB
        bytesSent: 123321 // 0.117608 MB
      }
      mock.onGet('connection/statistics').reply(200, response)

      const stats = await api.connectionStatistics()
      expect(stats).to.deep.equal(new ConnectionStatisticsDTO(response))
    })

    it('handles error', async () => {
      mock.onGet('connection/statistics').reply(500)

      const e = await capturePromiseError(api.connectionStatistics())
      expect(e.message).to.equal('Request failed with status code 500')
    })
  })
})
