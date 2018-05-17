// QLICKER
// Author: Enoch T <me@enocht.am>
//
// page_container.jsx: generic wrapper for logged in pages

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { PromoteAccountModal } from '../modals/PromoteAccountModal'
import { Courses } from '../../api/courses'

import { userGuideUrl } from '../../configs.js'
import $ from 'jquery'

class _PageContainer extends Component {

  constructor (props) {
    super(props)
    this.state = { 
      promotingAccount: false,
      course: this.props && this.props.course ? this.props.course : null,
      showCourse: this.props && this.props.course ? true : false
    }
    alertify.logPosition('bottom right')

    this.changeCourse = this.changeCourse.bind(this)
  }

  componentDidMount () {
    // Close the dropdown when selecting a link during mobile
    // view.
    $('.navbar-collapse .dropdown-menu').click(function () {
      $('.navbar-collapse').collapse('hide')
    })
  }

  componentWillReceiveProps (nextProps) {
    this.setState({ course: nextProps.course ? nextProps.course : this.state.course, showCourse: nextProps.course ? true : false })
  }

  changeCourse (course) {
    const pageName = Router.current().route.getName()
    if (!pageName.includes('session')) Router.go(pageName, { courseId: course._id })
    else Router.go('course', { courseId: course._id })
  }

  render () {
    const user = Meteor.user()
    const isInstructor = user.isInstructorAnyCourse() // to view student submissions
    const isProfessor = user.hasGreaterRole('professor') // to promote accounts
    const isAdmin = user.hasRole('admin')

    const logout = () => {
      Meteor.logout(() => Router.go('login'))
    }

    const togglePromotingAccount = () => { this.setState({ promotingAccount: !this.state.promotingAccount }) }

    const homePath = Router.routes[user.profile.roles[0]].path()
    const coursesPage = user.hasGreaterRole('professor')
      ? Router.routes['courses'].path()
      : Router.routes['student'].path()

    return (
      <div className='ql-page-container'>
        <nav className='navbar navbar-default navbar-fixed-top'>
          <div className='container'>
            <div className='navbar-header'>
              <button type='button' className='navbar-toggle collapsed' data-toggle='collapse' data-target='#navbar' aria-expanded='false' aria-controls='navbar'>
                <span className='sr-only'>Toggle navigation</span>
                <span className='icon-bar' />
                <span className='icon-bar' />
                <span className='icon-bar' />
              </button>
              <a href={homePath} className='ql-wordmark navbar-brand bootstrap-overrides'>Qlicker</a>
            </div>
            <div id='navbar' className='collapse navbar-collapse'>
              <ul className='nav navbar-nav'>
                { isAdmin
                   ? <li><a className='close-nav' href={Router.routes['admin'].path()}>Dashboard</a></li>
                   : ''
                }
                {  this.state.showCourse && !isAdmin
                   ? <li><a className='close-nav' role='button' onClick={() => Router.go('course', { courseId: this.state.course._id })}>Course Home</a></li>
                   : ''
                }
                { isAdmin
                  ? <li className='dropdown'>
                      <a href='#' className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>Grades <span className='caret' /></a>
                      <ul className='dropdown-menu' >
                        <li><a className='close-nav' href={Router.routes['results.overview'].path()} >All Courses</a></li>
                      </ul>
                    </li>
                  : this.state.showCourse 
                    ? <li className='dropdown'><a className='close-nav' role='button' onClick={() => Router.go('course.results', { courseId: this.state.course._id })}>Grades</a></li>
                    : ''
                }
                { this.state.showCourse && !isAdmin
                  ? <li className='dropdown'>
                    <a className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button'
                      aria-haspopup='true' aria-expanded='false' onClick={() => Router.go('questions', { courseId: this.state.course._id })}>Question library</a>
                    </li>
                  : ''

                }      
                { isAdmin 
                   ? <li><a className='close-nav' href={Router.routes['courses'].path()}>Courses</a></li>
                   : <li className='dropdown'>
                      <a href='#' className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>
                        { this.state.course 
                          ? this.state.course.deptCode.toUpperCase() + ' ' + this.state.course.courseNumber + ' - ' + this.state.course.name + ' '
                          : 'Courses'
                        }
                      <span className='caret' />
                      </a>
                      <ul className='dropdown-menu' >
                        <li><a className='close-nav' href={coursesPage} onClick={() => this.setState({ course: '', showCourse: false })}>All Courses</a></li>
                        <li role='separator' className='divider' >&nbsp;</li>
                        <li className='dropdown-header'>My Active Courses</li>
                        {
                          this.props.courses.map((c) => {
                            return (<li key={c._id}><a className='close-nav uppercase' href='#' onClick={() => this.changeCourse(c)}>{c.fullCourseCode()}</a></li>)
                          })
                        }
                      </ul>
                     </li>
                }
              </ul>

              <ul className='nav navbar-nav navbar-right'>
                <li className='dropdown bootstrap-overrides-padding'>
                  <a href='#' className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>
                    <img src={user.getThumbnailUrl()} className='nav-profile img-circle' /> {user.getName()} <span className='caret' />
                  </a>
                  <ul className='dropdown-menu'>
                    <li><a className='close-nav' href={Router.routes['profile'].path()}>Edit user profile</a></li>
                    {isProfessor
                      ? <li><a className='close-nav' href='#' onClick={togglePromotingAccount}>Promote an account to professor</a></li>
                      : ''
                    }
                    <li><a className='close-nav' href={userGuideUrl}>Visit user guide</a></li>
                    <li role='separator' className='divider' />
                    <li><a className='close-nav' href='#' onClick={logout} >Logout</a></li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className='ql-child-container'>
          { this.props.children }
          { isProfessor && this.state.promotingAccount
            ? <PromoteAccountModal done={togglePromotingAccount} />
            : '' }
        </div>
      </div>)
  }
}

export const PageContainer = createContainer(props => {
  const handle = Meteor.subscribe('courses')
  const courses = Courses.find({ inactive: { $in: [null, false] } }).fetch()
  const course = props && props.courseId ? Courses.findOne({ _id: props.courseId }) : null

  return {
    courses: courses,
    course: course,
    loading: !handle.ready()
  }
}, _PageContainer)


