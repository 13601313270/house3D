import { createStore } from 'vuex'

type IState = {
  userInfo: any,
}

type Store = {
  main: { [key in keyof IState]: IState[key] }
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
