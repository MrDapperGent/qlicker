// QLICKER
// Author: Enoch T <me@enocht.am>
//
// routes.jsx: iron-router routes

import React from 'react'
import { mount } from 'react-mounter'

// Layouts and Pages
import { AppLayout } from '../../ui/layouts/app_layout'
import { Homepage } from '../../ui/pages/home'
import { Loginpage } from '../../ui/pages/login'

import { Courses } from '../../api/courses.js'

import { ResetPasswordPage } from '../../ui/pages/reset_password'

import { PageContainer } from '../../ui/pages/page_container'

Router.configure({
  loadingTemplate: 'loading'
})
Router.onBeforeAction(function () {
  this.render('blank') // workaround for mounting react without blaze template
  this.next()
})

Router.route('/', function () {
  mount(AppLayout, { content: <Homepage /> })
}, {
  name: 'home'
})

Router.route('/login', {
  name: 'login',
  waitOn: function () {
    return Meteor.subscribe('userData')
  },
  action: function () {
    if (Meteor.userId()) {
      let user = Meteor.user()
      if (user.hasRole('admin')) Router.go('admin')
      if (user.hasRole('professor')) Router.go('professor')
      if (user.hasRole('student')) Router.go('student')
    } else mount(AppLayout, { content: <Loginpage /> })
  }
})

Router.route('/reset/:token', function () {
  mount(AppLayout, { content: <ResetPasswordPage token={this.params.token} /> })
}, {
  name: 'reset-password'
})


import { ProfilePage } from '../../ui/pages/profile'
Router.route('/profile', {
  name: 'profile',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('images')
  },
  action: function () {
    let user = Meteor.user()
    if (user) {
      mount(AppLayout, { content: <PageContainer user={user}> <ProfilePage /> </PageContainer> })
    } else Router.go('login')
  }
})

Router.route('/verify-email/:token', {
  name: 'verify-email',
  action: function () {
    if (this.params.token) {
      Accounts.verifyEmail(this.params.token, (error) => {
        if (error) {
          alertify.error('Error: ' + error.reason)
        } else {
          Router.go('/login')
          alertify.success('Email verified! Thanks!')
        }
      })
    } else {
      alertify.error('Error: could not verify your email.')
      Router.go('/')
    }
  }
})

// Admin routes
import { AdminDashboard } from '../../ui/pages/admin/admin_dashboard'
Router.route('/admin', {
  name: 'admin',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('settings')
  },
  action: function () {
    let user = Meteor.user()
    if (user.hasRole('admin')) {
      mount(AppLayout, { content: <PageContainer user={user}> <AdminDashboard /> </PageContainer> })
    } else Router.go('login')
  }
})

// Prof routes
import { ProfessorDashboard } from '../../ui/pages/professor/professor_dashboard'
Router.route('/manage', {
  name: 'professor',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData')
  },
  action: function () {
    let user = Meteor.user()
    if (user.hasRole('professor')) {
      mount(AppLayout, { content: <PageContainer user={user}> <ProfessorDashboard /> </PageContainer> })
    } else Router.go('login')
  }
})

import { QuestionsLibrary } from '../../ui/pages/professor/questions_library'
Router.route('/questions/library/:_id?', {
  name: 'questions',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses')
  },
  action: function () {
    const isInstructor = !!Courses.findOne({instructors: Meteor.userId(), inactive: false})
    if (isInstructor) {
      mount(AppLayout, { content: <PageContainer user={Meteor.user()}> <QuestionsLibrary selected={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})

import { QuestionsPublic } from '../../ui/pages/professor/questions_public'
Router.route('/questions/public', {
  name: 'questions.public',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses')
  },
  action: function () {
    let user = Meteor.user()
    const isInstructor = !!Courses.findOne({instructors: user._id, inactive: false})
    if (user.hasRole('professor') || isInstructor) {
      mount(AppLayout, { content: <PageContainer user={user}> <QuestionsPublic /> </PageContainer> })
    } else Router.go('login')
  }
})

import { QuestionsFromStudent } from '../../ui/pages/professor/questions_fromstudent'
Router.route('/questions/submissions', {
  name: 'questions.fromStudent',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData') && Meteor.subscribe('courses')
  },
  action: function () {
    let user = Meteor.user()
    const isInstructor = !!Courses.findOne({instructors: user._id, inactive: false})
    if (isInstructor) {
      mount(AppLayout, { content: <PageContainer user={user}> <QuestionsFromStudent /> </PageContainer> })
    } else Router.go('login')
  }
})



import { ManageCourses } from '../../ui/pages/professor/manage_courses'
Router.route('/courses', {
  name: 'courses',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData')
  },
  action: function () {
    let user = Meteor.user()
    if (user.hasGreaterRole('professor')) {
      mount(AppLayout, { content: <PageContainer user={user}> <ManageCourses /> </PageContainer> })
    } else Router.go('login')
  }
})

// Student Routes
import { StudentDashboard } from '../../ui/pages/student/student_dashboard'
Router.route('/student', {
  name: 'student',
  waitOn: function () {
    if (!Meteor.userId()) Router.go('login')
    return Meteor.subscribe('userData')
  },
  action: function () {
    let user = Meteor.user()
    if (user.hasGreaterRole('student')) {
      mount(AppLayout, { content: <PageContainer user={user}> <StudentDashboard /> </PageContainer> })
    } else Router.go('login')
  }
})

// Shared routes
import { ManageCourse } from '../../ui/pages/professor/manage_course'
import { Course } from '../../ui/pages/student/course'
Router.route('/course/:_id', {
  name: 'course',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('courses')
  },
  action: function () {
    if (Meteor.user().hasGreaterRole('professor')) {
      mount(AppLayout, {content: <PageContainer> <ManageCourse courseId={this.params._id}/> </PageContainer>})
    } else if (Meteor.user().isInstructor(this.params._id)) {
      mount(AppLayout, {content: <PageContainer> <ManageCourse isInstructor courseId={this.params._id}/> </PageContainer>})
    } else if (Meteor.user().hasRole('student')) {
      mount(AppLayout, { content: <PageContainer> <Course courseId={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})

import { ResultsOverview } from '../../ui/pages/results_overview'
Router.route('/courses/results', {
  name: 'results.overview',
  waitOn: function () {
    return Meteor.subscribe('userData')
  },
  action: function () {
    const u = Meteor.user()
    if (u) {
      mount(AppLayout, { content: <PageContainer> <ResultsOverview /> </PageContainer> })
    } else Router.go('login')
  }
})

import { ClasslistParticipationPage } from '../../ui/pages/classlist_participation'
Router.route('/course/:_id/results', {
  name: 'course.results',
  waitOn: function () {
    return Meteor.subscribe('userData')
  },
  action: function () {
    if (Meteor.user()) {
      mount(AppLayout, { content: <PageContainer> <ClasslistParticipationPage courseId={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})

import { ResultsPage } from '../../ui/pages/results'
Router.route('/results/session/:sessionId', {
  name: 'session.results',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') && Meteor.subscribe('sessions')
  },
  action: function () {
    if (Meteor.user()) {
      mount(AppLayout, { content: <PageContainer> <ResultsPage sessionId={this.params.sessionId} /> </PageContainer> })
    } else Router.go('login')
  }
})

import { StudentResultsPage } from '../../ui/pages/student_results'
Router.route('/results/:studentId/:courseId', {
  name: 'student.results',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') && Meteor.subscribe('sessions')
  },
  action: function () {
    if (Meteor.user()) {
      mount(AppLayout, { content: <PageContainer>
        <StudentResultsPage studentId={this.params.studentId} courseId={this.params.courseId} />
      </PageContainer> })
    } else Router.go('login')
  }
})

import { StudentSessionResultsPage } from '../../ui/pages/student_session_results'
Router.route('/results/:sessionId', {
  name: 'student.session.results',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('courses') && Meteor.subscribe('sessions')
  },
  action: function () {
    if (Meteor.user()) {
      mount(AppLayout, { content: <PageContainer>
        <StudentSessionResultsPage sessionId={this.params.sessionId} studentId={Meteor.userId()} />
      </PageContainer> })
    } else Router.go('login')
  }
})

import { ManageSession } from '../../ui/pages/professor/manage_session'
Router.route('/session/edit/:_id', {
  name: 'session.edit',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('sessions') && Meteor.subscribe('courses') && Meteor.subscribe('images')
  },
  action: function () {
    const cId = Courses.find({sessions: this.params._id}).fetch()[0]._id
    const isInstructor = Meteor.user().isInstructor(cId)
    if (Meteor.user().hasGreaterRole('professor') || isInstructor) {
      mount(AppLayout, { content: <PageContainer> <ManageSession isInstructor={isInstructor} sessionId={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})

import { RunSession } from '../../ui/pages/professor/run_session'
Router.route('/session/run/:_id', {
  name: 'session.run',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('sessions')
  },
  action: function () {
    const cId = Courses.find({sessions: this.params._id}).fetch()[0]._id
    if (Meteor.user().isInstructor(cId)) {
      mount(AppLayout, { content: <PageContainer> <RunSession sessionId={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})

import { Session } from '../../ui/pages/student/session'
Router.route('/session/present/:_id', {
  name: 'session',
  waitOn: function () {
    return Meteor.subscribe('userData') && Meteor.subscribe('sessions') && Meteor.subscribe('courses')
  },
  action: function () {
    const user = Meteor.user()
    const cId = Courses.find({sessions: this.params._id}).fetch()[0]._id
    if (user && user.isInstructor(cId)) {
      mount(AppLayout, { content: <Session sessionId={this.params._id} /> })
    } else if (user) {
      mount(AppLayout, { content: <PageContainer> <Session sessionId={this.params._id} /> </PageContainer> })
    } else Router.go('login')
  }
})
