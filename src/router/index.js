import Vue from 'vue'
import Router from 'vue-router'

import login from '@/view/login'


Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '',
      redirect: '/login'
    },
    {
      path: '/login',
      component: login,
      name: '登录',
      hidden: true
    }]
})
