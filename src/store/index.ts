import { createStore } from 'vuex'

type EditMode = 'scene' | 'animation'

type IState = {
  userInfo: {
    email: string
    getJoinGroupMoney: boolean
    id: number
    money: number
    vipEndDate: string,
  },
  editMode: EditMode,
}

type Store = {
  main: IState
}

const main = {
  namespaced: true,
  state: {
    userInfo: {},
    editMode: 'scene' as EditMode,
  },
  getters: {
    userInfo: (state: IState) => state.userInfo,
    editMode: (state: IState) => state.editMode,
  },
  mutations: {
    set_user_info(state: IState, userInfo: any) {
      state.userInfo = userInfo;
    },
    set_edit_mode(state: IState, editMode: EditMode) {
      state.editMode = editMode;
    },
  },
  actions: {
    setUserInfo({ commit }: any, userInfo: any) {
      return commit('set_user_info', userInfo);
    },
    setEditMode({ commit }: any, editMode: EditMode) {
      return commit('set_edit_mode', editMode);
    },
  },
};
export default createStore({
  modules: {
    main
  }
})

export type { Store, EditMode }
