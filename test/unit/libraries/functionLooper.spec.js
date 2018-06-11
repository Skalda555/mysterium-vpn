
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

import lolex from 'lolex'
import { FunctionLooper, ThresholdExecutor } from '@/../libraries/functionLooper'
import sleep from '@/../libraries/sleep'
import {nextTick} from '../../helpers/utils'

describe('utils', () => {
  let clock

  before(() => {
    clock = lolex.install()
  })

  after(() => {
    clock.uninstall()
  })

  async function tickWithDelay (duration) {
    clock.tick(duration)
    await nextTick()
  }

  describe('FunctionLooper', () => {
    describe('.start', () => {
      it('executes function multiple times with threshold', async () => {
        let counter = 0
        async function increaseCounter () {
          counter++
        }

        const looper = new FunctionLooper(increaseCounter, 1000)
        expect(counter).to.eql(0)

        looper.start()
        expect(counter).to.eql(1)

        await tickWithDelay(1000)
        expect(counter).to.eql(2)

        await tickWithDelay(2500)
        expect(counter).to.eql(3)

        await tickWithDelay(1000)
        expect(counter).to.eql(4)
      })

      it('does not starts second loop when invoked twice', () => {
        let counter = 0
        async function increaseCounter () {
          counter++
        }

        const looper = new FunctionLooper(increaseCounter, 1000)
        looper.start()
        looper.start()
        expect(counter).to.eql(1)
      })

      it('executes function multiple times when function throws exception', async () => {
        let counter = 0
        async function throwError () {
          counter++
          throw new Error('mock error')
        }

        const looper = new FunctionLooper(throwError, 1000)
        expect(counter).to.eql(0)

        looper.start()
        expect(counter).to.eql(1)

        await tickWithDelay(1000)
        expect(counter).to.eql(2)
      })
    })

    describe('.stop', () => {
      it('stops function execution', async () => {
        let counter = 0
        async function increaseCounter () {
          counter++
        }

        const looper = new FunctionLooper(increaseCounter, 1000)
        looper.start()
        expect(counter).to.eql(1)

        await tickWithDelay(1000)
        expect(counter).to.eql(2)

        looper.stop()

        await tickWithDelay(10000)
        expect(counter).to.eql(2)
      })

      it('waits for the last execution', async () => {
        let counter = 0
        async function increaseCounter () {
          await sleep(400)
          counter++
        }

        const looper = new FunctionLooper(increaseCounter, 1000)
        looper.start()

        let stopped = false
        looper.stop().then(() => { stopped = true })
        expect(stopped).to.eql(false)
        expect(counter).to.eql(0)

        await tickWithDelay(400)
        expect(stopped).to.eql(true)
        expect(counter).to.eql(1)
      })
    })

    describe('.isRunning', () => {
      it('returns current looper state', async () => {
        const func = () => {}
        const looper = new FunctionLooper(func, 1000)

        expect(looper.isRunning()).to.eql(false)

        looper.start()
        expect(looper.isRunning()).to.eql(true)

        looper.stop()
        await tickWithDelay(1000)
        expect(looper.isRunning()).to.eql(false)
      })
    })
  })

  describe('ThresholdExecutor', () => {
    let funcDone, thresholdDone

    const syncFunc = async () => {
      funcDone = true
    }

    const asyncFunc = (duration) => async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          funcDone = true
          resolve()
        }, duration)
      })
    }

    beforeEach(() => {
      funcDone = false
      thresholdDone = false
    })

    function markThresholdDone () {
      thresholdDone = true
    }

    describe('with sync function', () => {
      it('executes function', async () => {
        const executor = new ThresholdExecutor(syncFunc, 10000)
        executor.execute().then(markThresholdDone)

        // not complete after 9s
        await tickWithDelay(9000)
        expect(funcDone).to.eql(true)
        expect(thresholdDone).to.eql(false)

        // complete after 10s
        await tickWithDelay(9000)
        expect(thresholdDone).to.eql(true)
      })
    })

    describe('with async function', () => {
      it('executes function', async () => {
        const fastAsyncFunc = asyncFunc(5000)
        const executor = new ThresholdExecutor(fastAsyncFunc, 10000)
        executor.execute().then(markThresholdDone)

        // not complete after 9s
        await tickWithDelay(9000)
        expect(funcDone).to.eql(true)
        expect(thresholdDone).to.eql(false)

        // complete after 10s
        await tickWithDelay(1000)
        expect(thresholdDone).to.eql(true)
      })

      it('allows canceling sleep', async () => {
        const slowAsyncFunc = asyncFunc(5000)
        const executor = new ThresholdExecutor(slowAsyncFunc, 10000)
        executor.execute().then(markThresholdDone)

        executor.cancel()

        // complete after 5s
        await tickWithDelay(5000)
        expect(thresholdDone).to.eql(true)
      })

      // TODO: canceling in the middle of sleep?
    })

    describe('with slow async function', () => {
      it('executes function', async () => {
        const slowAsyncFunc = asyncFunc(5000)
        const executor = new ThresholdExecutor(slowAsyncFunc, 1000)
        executor.execute().then(markThresholdDone)

        // not complete after 4s
        await tickWithDelay(4000)
        expect(funcDone).to.eql(false)
        expect(thresholdDone).to.eql(false)

        // complete after 10s
        await tickWithDelay(6000)
        expect(funcDone).to.eql(true)
        expect(thresholdDone).to.eql(true)
      })
    })

    describe('with function trowing error', () => {
      it('sleeps and throws error', async () => {
        const mockError = new Error('Mock error')
        const errorFunc = async () => {
          throw mockError
        }
        const executor = new ThresholdExecutor(errorFunc, 1000)
        let error = null
        executor.execute().catch((err) => {
          error = err
          markThresholdDone()
        })

        expect(thresholdDone).to.be.false
        expect(error).to.eql(null)

        await tickWithDelay(1000)
        expect(thresholdDone).to.be.true
        expect(error).to.eql(mockError)
      })
    })
  })
})
