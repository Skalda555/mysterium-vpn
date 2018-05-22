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
// TODO: rename to `vpn.js` to be consistent with `Vpn.vue`
import type from '../types'
import type { TequilapiClient } from '../../../libraries/mysterium-tequilapi/client'

const state = {
  init: '',
  visual: 'head',
  navOpen: false,
  clientBuildInfo: {},
  navVisible: true,
  errorMessage: null,
  showError: false
}

// TODO: add type for state

const getters = {
  loading: (state: Object) => (state.init === type.INIT_PENDING),
  visual: (state: Object) => state.visual,
  navOpen: (state: Object) => state.navOpen,
  navVisible: (state: Object) => state.navVisible && !(state.init === type.INIT_PENDING),
  clientBuildInfo: (state: Object) => state.clientBuildInfo,
  errorMessage: (state: Object) => state.errorMessage,
  showError: (state: Object) => state.showError
}

const mutations = {
  [type.CLIENT_BUILD_INFO] (state, buildInfo: string) {
    state.clientBuildInfo = buildInfo
  },
  [type.SET_NAV_OPEN] (state, open) {
    state.navOpen = open
  },
  [type.SET_NAV_VISIBLE] (state, visible: boolean) {
    state.navVisible = visible
  },
  [type.SET_VISUAL] (state, visual: boolean) {
    state.visual = visual
  },
  [type.INIT_SUCCESS] (state) {
    state.init = type.INIT_SUCCESS
  },
  [type.INIT_PENDING] (state) {
    state.init = type.INIT_PENDING
  },
  [type.INIT_FAIL] (state, err: ?Error) {
    state.init = type.INIT_FAIL
    state.error = err
  },
  [type.INIT_NEW_USER] (state) {
    // TODO: remove if this is not used anywhere
    state.newUser = true
  },
  [type.SHOW_ERROR] (state, err) {
    state.showError = true
    if (err && err.response && err.response.data && err.response.data.message) {
      state.errorMessage = err.response.data.message
      return
    }
    if (err.message) {
      state.errorMessage = err.message
      return
    }
    state.errorMessage = 'Unknown error'
  },
  [type.SHOW_ERROR_MESSAGE] (state, errorMessage: string) {
    state.errorMessage = errorMessage
    state.showError = true
  },
  [type.HIDE_ERROR] (state) {
    state.showError = false
  }
}

function actionsFactory (tequilapi: TequilapiClient) {
  return {
    switchNav ({commit}, open: boolean) {
      commit(type.SET_NAV_OPEN, open)
    },
    setVisual ({commit}, visual: boolean) {
      commit(type.SET_VISUAL, visual)
    },
    async [type.CLIENT_BUILD_INFO] ({commit}) {
      const res = await tequilapi.healthCheck()
      commit(type.CLIENT_BUILD_INFO, res.version)
    },
    setNavVisibility ({commit}, visible: boolean) {
      commit(type.SET_NAV_VISIBLE, visible)
    }
  }
}

function factory (tequilapi: TequilapiClient) {
  return {
    state,
    mutations,
    getters,
    actions: actionsFactory(tequilapi)
  }
}

export {
  state,
  mutations,
  getters,
  actionsFactory
}
export default factory
