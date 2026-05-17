import { defineStore } from 'pinia'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
}

export const useAuthStore = defineStore('auth', {
  state: (): { user: User | null; accessToken: string | null } => ({
    user: null,
    accessToken: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    fullName: (state) => state.user ? `${state.user.firstName} ${state.user.lastName}` : '',
  },

  actions: {
    setToken(token: string) {
      this.accessToken = token
    },
    setUser(user: User) {
      this.user = user
    },
    clear() {
      this.user = null
      this.accessToken = null
    },
  },
})
