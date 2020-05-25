// QLICKER
// Author: Enoch T <me@enocht.am>
//
// page_container.jsx: generic wrapper for logged in pages

import React, { Component } from 'react'
import { withTracker }  from 'meteor/react-meteor-data'

import { PromoteAccountModal } from '../modals/PromoteAccountModal'
import { Courses } from '../../api/courses'

import { userGuideUrl } from '../../configs.js'
import $ from 'jquery'

class _PageContainer extends Component {

  constructor (props) {
    super(props)
    this.state = {
      promotingAccount: false,
      courseId: this.props && this.props.courseId ? this.props.courseId : '',
      courseCode: '',
      ssoLogoutUrl: null,
      ssoInstitution: null,
      showCourse: (this.props && this.props.courseId)
    }
    alertify.logPosition('bottom right')

    this.changeCourse = this.changeCourse.bind(this)
    this.setCourseCode = this.setCourseCode.bind(this)

    if(this.state.courseId !== '') {
      this.setCourseCode(this.state.courseId)
    }

  }

  setCourseCode (courseId) {
    Meteor.call('courses.getCourseCodePretty', courseId, (e, c) => {
      if(c) {
        this.setState({ courseCode: c})
      }
    })
  }

  componentWillMount () {
    const token =  Meteor.user() ? Meteor._localStorage.getItem('Meteor.loginToken') : undefined
    if (token){
      Meteor.call("getSSOLogoutUrl", token, (err,result) => {
        if(!err){
          this.setState({ssoLogoutUrl:result})
          Meteor.call("settings.getSSOInstitution", (err2,name) => {
            if(!err2)this.setState({ssoInstitution:name})
          })
        }
      })
    }
  }

  componentDidMount () {
    // Close the dropdown when selecting a link during mobile
    // view.
    $('.navbar-collapse .dropdown-menu').click(function () {
      $('.navbar-collapse').collapse('hide')
    })
  }

  componentWillReceiveProps (nextProps) {
    this.setState({ courseId: nextProps.courseId ? nextProps.courseId : this.state.courseId, showCourse: nextProps.courseId ? true : false })
    if(nextProps.courseId) this.setCourseCode(nextProps.courseId)
  }

  changeCourse (courseId) {
    const pageName = Router.current().route.getName()
    //TODO: double check this, that all cases are caught!
    if (!(pageName.includes('session') || pageName === 'courses' || pageName === 'professor'  || pageName === 'admin' || pageName === 'student'  || pageName === 'profile' )) Router.go(pageName, { courseId: courseId })
    else{
      Router.go('course', { courseId: courseId })
    }
  }

  render () {
    const user = Meteor.user()

    if(!user)  Router.go('logout')
    //const isInstructor = user.isInstructorAnyCourse() // to view student submissions
    const canPromote = user.canPromote() //user.hasGreaterRole('professor') // to promote accounts
    const isAdmin = user.hasRole('admin')

    const logout = () => {
      Router.go('logout')
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
                   ? <li><a className='close-nav' href={Router.routes['admin'].path()}>Settings</a></li>
                   : ''
                }
                {  this.state.showCourse
                   ? <li><a className='close-nav' role='button' onClick={() => Router.go('course', { courseId: this.state.courseId })}>Course Home</a></li>
                   : ''
                }
                { /*isAdmin
                  ? <li> <a className='close-nav' href={Router.routes['results.overview'].path()}>Grades</a></li>
                  : this.state.showCourse
                    ? <li className='dropdown'><a className='close-nav' role='button' onClick={() => Router.go('course.results', { courseId: this.state.courseId })}>Grades</a></li>
                    : ''
                */}
                { this.state.showCourse
                  ? <li className='dropdown'><a className='close-nav' role='button' onClick={() => Router.go('course.results', { courseId: this.state.courseId })}>Grades</a></li>
                  : isAdmin
                    ? <li className='dropdown'><a className='close-nav' href={Router.routes['results.overview'].path()}>Grades</a></li>
                    :''
                }
                { this.state.showCourse /*&& !isAdmin*/
                  ? <li className='dropdown'>
                    <a className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button'
                      aria-haspopup='true' aria-expanded='false' onClick={() => Router.go('questions', { courseId: this.state.courseId })}>Question library</a>
                    </li>
                  : ''

                }

                { isAdmin
                  ? this.state.showCourse && this.state.courseId
                      ? <li className='dropdown'>
                          <a className='close-nav' href='#'  className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>
                             {this.state.courseCode}
                             <span className='caret' />
                           </a>
                           <ul className='dropdown-menu' >
                             <li><a className='close-nav' href={coursesPage} onClick={() => this.setState({ courseId: '', showCourse: false })}>All Courses</a></li>
                           </ul>
                         </li>
                      : <li><a className='close-nav' href={Router.routes['courses'].path()}> Courses</a></li>
                  : <li className='dropdown'>
                     <a href='#' className='dropdown-toggle bootstrap-overrides' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>
                       { this.state.courseId
                         ?  this.state.courseCode
                         : 'Courses'
                       }
                     <span className='caret' />
                     </a>
                     <ul className='dropdown-menu' >
                       <li><a className='close-nav' href={coursesPage} onClick={() => this.setState({ courseId: '', showCourse: false })}>All Courses</a></li>
                       <li role='separator' className='divider' >&nbsp;</li>
                       <li className='dropdown-header'>My Active Courses</li>
                       {
                         this.props.courses.map((c) => {
                           return (<li key={c._id}><a className='close-nav uppercase' href='#' onClick={() => this.changeCourse(c._id)}>{c.fullCourseCode()}</a></li>)
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
                    <li><a className='close-nav' href={Router.routes['profile'].path()}>User profile</a></li>
                    {canPromote
                      ? <li><a className='close-nav' href='#' onClick={togglePromotingAccount}>Promote an account to professor</a></li>
                      : ''
                    }
                    <li><a className='close-nav' href={userGuideUrl}>Visit user guide</a></li>
                    <li role='separator' className='divider' />

                    {this.state.ssoLogoutUrl ?
                          <li><a className='close-nav' href={this.state.ssoLogoutUrl} onClick={logout}  > Logout from Qlicker and {this.state.ssoInstitution ? this.state.ssoInstitution : 'SSO' }</a></li>
                          : <li><a className='close-nav' href={Router.routes['logout'].path()} onClick={logout} >Logout from Qlicker</a></li>
                    }
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className='ql-child-container'>
          { this.props.children }
          { canPromote && this.state.promotingAccount
            ? <PromoteAccountModal done={togglePromotingAccount} />
            : '' }
        </div>
      </div>)
  }
}

export const PageContainer = withTracker(props => {
  const handle = Meteor.subscribe('courses')
  const courses = Courses.find({ inactive: { $in: [null, false] } }).fetch()

  return {
    courses: courses,
    //courseId: props.courseId,
    loading: !handle.ready()
  }
})( _PageContainer)
