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
  saveByFile: boolean,
  hasUnsavedChanges: boolean,
}

type Store = {
  main: IState
}

const main = {
  namespaced: true,
  state: {
    userInfo: {},
    editMode: 'scene' as EditMode,
    saveByFile: false,
    hasUnsavedChanges: false,
  },
  getters: {
    userInfo: (state: IState) => state.userInfo,
    editMode: (state: IState) => state.editMode,
    saveByFile: (state: IState) => state.saveByFile,
    hasUnsavedChanges: (state: IState) => state.hasUnsavedChanges,
  },
  mutations: {
    set_user_info(state: IState, userInfo: any) {
      state.userInfo = userInfo;
    },
    set_edit_mode(state: IState, editMode: EditMode) {
      state.editMode = editMode;
    },
    set_save_by_file(state: IState, saveByFile: boolean) {
      state.saveByFile = saveByFile;
    },
    mark_unsaved(state: IState, value: boolean) {
      state.hasUnsavedChanges = value;
    },
  },
  actions: {
    setUserInfo({ commit }: any, userInfo: any) {
      return commit('set_user_info', userInfo);
    },
    setEditMode({ commit }: any, editMode: EditMode) {
      return commit('set_edit_mode', editMode);
    },
    setSaveByFile({ commit }: any, saveByFile: boolean) {
      return commit('set_save_by_file', saveByFile);
    },
    markUnsaved({ commit }: any, value: boolean) {
      return commit('mark_unsaved', value);
    },
  },
};
export default createStore({
  modules: {
    main
  }
})

export type { Store, EditMode }
