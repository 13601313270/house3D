import { createStore } from 'vuex'

type IState = {
  userInfo: {
    email: string
    getJoinGroupMoney: boolean
    id: number
    money: number
    vipEndDate: string,
  },
}

type Store = {
  main: IState
}

const main = {
  namespaced: true,
  state: {
    userInfo: {}
  },
  getters: {
    userInfo: (state: IState) => state.userInfo,
  },
  mutations: {
    set_user_info(state: IState, userInfo: any) {
      state.userInfo = userInfo;
    },
  },
  actions: {
    setUserInfo({ commit }: any, userInfo: any) {
      return commit('set_user_info', userInfo);
    },
  },
};
export default createStore({
  modules: {
    main
  }
})

export type { Store }
