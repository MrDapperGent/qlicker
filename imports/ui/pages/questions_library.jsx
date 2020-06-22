// QLICKER
// Author: Enoch T <me@enocht.am>
//
// questions_library.jsx: page for managing and editing your own questions

//import React, { Component } from 'react'
import React, { Component } from 'react'
import PropTypes from 'prop-types';
// import ReactDOM from 'react-dom'
import { withTracker }  from 'meteor/react-meteor-data'
import _ from 'underscore'


import { QuestionEditItem } from '../QuestionEditItem'
import { QuestionDisplay } from '../QuestionDisplay'
import { QuestionSidebar } from '../QuestionSidebar'

import { defaultQuestion } from '../../api/questions'
//import { defaultQuestion } from '../../api/questions'
import { Courses } from '../../api/courses'

import { QUESTION_TYPE } from '../../configs'


export class _QuestionsLibrary extends Component {

  constructor (props) {
    super(props)
    this.state = {
      selectedQuestion: null,
      resetSidebar: false, // only to trigger prop update of side bar when creating new question and thus clear the filter (used as toggle)
      selectedLibrary: 'library',
      courseCode:'',
    }
    /*
    if (this.props.selectedQuestion) {
      if (this.props.selectedQuestion) this.state.selectedQuestion = this.props.selectedQuestion
    }*/

    //this.convertField = this.convertField.bind(this)
    //this.exportQuestions = this.exportQuestions.bind(this)
    //this.importQuestions = this.importQuestions.bind(this)
    this.editQuestion = this.editQuestion.bind(this)
    this.questionDeleted = this.questionDeleted.bind(this)
    this.toggleApproveQuestion = this.toggleApproveQuestion.bind(this)
    this.copyToLibrary = this.copyToLibrary.bind(this)
    this.deleteQuestion = this.deleteQuestion.bind(this)
    this.toggleQuestionPublic = this.toggleQuestionPublic.bind(this)
    this.setFilter = this.setFilter.bind(this)
    this.setLib = this.setLib.bind(this)
    this.doneEditing = this.doneEditing.bind(this)
  }

  componentWillReceiveProps (newProps) {
    if (newProps.courseId !== this.props.courseId){
      this.setState({ resetSidebar: true, selectedQuestion: null })
    }
  }
/*
  convertImageToBase64 (url, count, callback) {
    let xhttp = new XMLHttpRequest()
    xhttp.responseType = 'blob'
    xhttp.open('GET', url, true)
    xhttp.send()

    xhttp.onload = function() {
      let fileReader = new FileReader()
      fileReader.onloadend = function() {
          newItem = fileReader.result
          let done = false
          if (count === 0) done = true
          callback(newItem, done)
      }
      fileReader.readAsDataURL(xhttp.response)
    }
  }

  convertField (questions, question, date, courseId, count, content) {
    let newContent = ''
    content.forEach(item => {
      let newItem = item
      if (item.search(/src(s*)=/) !== -1 && item.search('data') === -1) { // convert image to data uri if image source is a url
        let url = item.split(/src(s*)=/)[2]
        url = url.replace(/"/g, '') //Trim any quotations
        // Callback executes asynchronously
        this.convertImageToBase64(url, count, (result, done) => {
          if (done) {
            const dataURL = '<img src=' + result + ' />'
            newContent = newContent.replace(newItem, dataURL)
            question.solution = newContent
            let data = {
              originalCourse: courseId,
              date: date,
              questions: questions
            }

            const jsonData = JSON.stringify(data)

            const a = document.createElement("a")
            const file = new Blob([jsonData], {type: 'text/plain'})
            a.href = URL.createObjectURL(file)

            Meteor.call('courses.getCourseCode', courseId, (err, result) => {
              if (err) a.download = 'Questions.json'
              else a.download = 'Questions' + result + '.json'
              a.click()
            })
          }
        })
        count += 1
      }
      newContent = newContent + ' ' +  newItem
    })
    if (count === 0) {
      let data = {
        originalCourse: courseId,
        date: date,
        questions: questions
      }

      const jsonData = JSON.stringify(data)

      const a = document.createElement("a")
      const file = new Blob([jsonData], {type: 'text/plain'})
      a.href = URL.createObjectURL(file)

      Meteor.call('courses.getCourseCode', courseId, (err, result) => {
        if (err) a.download = 'Questions.json'
        else a.download = 'Questions' + result + '.json'
        a.click()
      })
    }
  }

  exportQuestions () {
    const courseId = this.props.courseId
    const date = new Date()
    let questions = this.state.questions
    let count = 0
    const splitPattern = /<\s*img(.*)\/>/
    questions.forEach(question => {
      this.convertField(questions, question, date, courseId, count, question.content.split(splitPattern))
      count += 1
      this.convertField(questions, question, date, courseId, count, question.solution.split(splitPattern))
      question.options.forEach(option => {
        this.convertField(questions, question, date, courseId, count, option.content.split(splitPattern))
      })
    })
  }

  importQuestions (event) {
    const file = event.target.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.readAsText(file, 'UTF-8')
      reader.onload = (e) => {
        const data = JSON.parse(e.target.result)
        const questions = data.questions

        questions.forEach(question => {
          question.courseId = this.props.courseId
          question.createdAt = new Date()
          delete question._id
          Meteor.call('questions.insert', question, (err, result) => {
            if (err) alertify.error('Error: ' + err.error)
            else alertify.success('Questions saved')
          })
        })
      }
    }
    else alertify.error('Error: Incorrect file format')
  }*/

  editQuestion (question) {
    if (question === null) {
      // reset the query

      //this.setState({/*query: this.props.query,*/ resetSidebar: true})
      const blankQuestion = _.extend(defaultQuestion, {
        //owner: Meteor.userId(),
        //creator: Meteor.userId(),
        //approved: Meteor.user().isInstructor(this.props.courseId),
        courseId: this.props.courseId
      })

      if(!Meteor.user().isInstructor(this.props.courseId)){
        const studentTag = {label:'STUDENT', value:'STUDENT'}
        if(blankQuestion.tags.indexOf(blankQuestion.tags) === -1) blankQuestion.tags.push(studentTag)
      }
      //For some reason, if you don't first set the selected question to null, the CK Editor
      //diplays the text from the previous selected question.
      this.setState({selectedQuestion: null}, () => {
        Meteor.call('questions.insert', blankQuestion, (e, newQuestion) => {
          if (e) return alertify.error('Error: couldn\'t add new question')
          alertify.success('New Blank Question Added')
          this.setState({ resetSidebar: true, selectedQuestion: newQuestion})
        })
      })

    } else { //When we change the question passed to the editor, we first need to pass it a
      // null question, and then the actual question, otherwise, it shows the text of the previous
      //selected question (that's why the nested setStats in else below)
        if(!this.state.selectedQuestion || this.state.selectedQuestion._id === question._id){
          this.setState({ selectedQuestion: question })
        } else {
          this.setState({ selectedQuestion: null }, () =>{
            this.setState({ selectedQuestion: question })
          })
        }


      /*
      if(!this.state.selectedQuestion || question._id !== this.state.selectedQuestion._id) {
        this.setState({ selectedQuestion: null }, () =>{
          this.setState({ selectedQuestion: question })
        })
      }*/
    }
  }

  // close the editor
  doneEditing () {
    this.setState({ selectedQuestion:null })
  }

  toggleApproveQuestion (question) {
    let user = Meteor.user()
    if (!user.isInstructor(this.props.courseId)) {
      alertify.error('Not authorized')
      return
    }
    if (question.approved){
      question.owner = question.creator
    } else {
      question.owner = user._id
      //Change the date so that it sorts to the top of the course library
      question.createdAt = new Date()
    }
    question.public = false
    question.approved = !question.approved

    Meteor.call('questions.update', question, (error, newQuestion) => {
      if (error) return alertify.error('Error: ' + error.error)
      const message = 'Question '+(question.approved ? 'approved' : 'un-approved' )
      alertify.success(message)
    })
    this.setState({ selectedQuestion:null })

  }

  toggleQuestionPublic (question) {
   // by making it public, you take over ownership, so student cannot delete it anymore
   // it will also show in the library for any instructor of the course
   let user = Meteor.user()
   if (!user.isInstructor(this.props.courseId)) return
   if (!question.public){
     question.approved = true //public questions must be approved
     //Change the date so that it sorts to the top of the course library
     question.createdAt = new Date()
   }
   question.owner = Meteor.userId()
   question.public = !question.public

   Meteor.call('questions.update', question, (error, newQuestionId) => {
     if (error) return alertify.error('Error: ' + error.error)
     const message = 'Question moved '+(question.public ? 'into ' : 'out of ' )+'public area'
     alertify.success(message)
   })
   this.setState({ selectedQuestion:null })
    //this.selectQuestion(null)
  }

  // a student copying a question to their library for the course
  copyToLibrary (question) {
    let user = Meteor.user()
    if (!user.isStudent(this.props.courseId)) {
      alertify.error('Cannot copy to instructor library')
      return
    }
    Meteor.call('questions.copyToLibrary', question._id, (error, newQuestionId) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question copied to library')
    })
    //this.setState({ selectedQuestion : null })
  }

  deleteQuestion (question) {
    let user = Meteor.user()
    if(user.isStudent(this.props.courseId) && (question.approved || question.owner !== user._id)){
      alertify.error('Not authorized')
      return
    }

    Meteor.call('questions.delete', question._id, (error) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question Deleted')
      this.questionDeleted()
    })
  }

  questionDeleted () {
    this.setState({ selectedQuestion: null, resetSidebar: false })
  }

  setFilter (newState) {
    //console.log('setFilter in questionLibrary')
    //console.log(newState)
    this.setState({ resetSidebar: newState})
  }

  setLib (library) {
    this.setState({ selectedLibrary: library, selectedQuestion: null })
  }

  render () {
    //if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const user =  Meteor.user()
    const isInstructor = user.isInstructor(this.props.courseId)
    const isStudent = user.isStudent(this.props.courseId)
    let canEdit = true //whether the selected question can be edited
    let canCreate = true //whether user can create a new question
    let canToggleApprove = true //whether user can approve and unApprove selected question
    let canTogglePublic = true //whether user can make selected question public
    let canCopy = true //whether user (student) can copy selected question to their library
    // students can copy an approved question back to their library

    let selectedQuestion = this.state.selectedQuestion //this.state.questionMap[this.state.selectedQuestionId]

    //only edit in course library
    if (this.state.selectedLibrary === 'unapprovedFromStudents' || this.state.selectedLibrary === 'public'){
      canEdit = false
      canCreate = false
    }

    if (this.state.selectedLibrary === 'unapprovedFromStudents' || isInstructor) {
      canCopy = false
    }
    //only edit if question exists...
    if (selectedQuestion) {
      //student cannot edit if course does not allow, or if it's approved, or if they are not the owner
      if ( !isInstructor &&  (!this.props.course.allowStudentQuestions || selectedQuestion.approved || !selectedQuestion.owner === user._id) ){
        canEdit = false
      }
      // can't approve if creator. This avoids an instructor unapproving a question they created, which would orphan it
      // TODO: really, should not be able to un-approve a question not created by an instructor
      if (selectedQuestion.creator === user._id && selectedQuestion.approved) canToggleApprove = false
      // can't make public if student
      if (!isInstructor){
        canTogglePublic = false
        canToggleApprove = false
      }
    } else { // can't edit if there is no questions
      canEdit = false
      canToggleApprove = false
      canTogglePublic = false
      canCopy = false
    }
    //can't create if not instructor or course does not allow student questions
    if (isStudent && !this.props.course.allowStudentQuestions) {
      canCreate = false
    }

    const active = this.state.selectedLibrary

    return (
      <div className='container ql-questions-library'>
        <div>
          <div className='row'>
            <div className='col-md-4'>
              <ul className='nav nav-tabs'>
                <li role='presentation' className={active === 'library' ? 'active' : ''}>
                  <a role='button' onClick={() => this.setLib('library')}>{isInstructor ? 'Course' : 'My Questions'}</a>
                </li>
                <li role='presentation' className={active === 'public' ? 'active' : ''}>
                  <a role='button' onClick={() => this.setLib('public')}>Public</a>
                </li>
                { isInstructor
                  ? <li role='presentation' className={active === 'unapprovedFromStudents' ? 'active' : ''}>
                      <a role='button' onClick={() => this.setLib('unapprovedFromStudents')}>Student</a>
                    </li>
                  : '' }
              </ul>
              <br />
              { canCreate
                ? <div>
                    <button className='btn btn-primary' style={{'width':'100%'}} onClick={() => this.editQuestion(null)}>New Question</button>
                  </div>
                : ''
              }
              <QuestionSidebar
                questionLibrary={this.state.selectedLibrary}
                courseId={this.props.courseId}
                onSelect={this.editQuestion}
                resetSidebar={this.state.resetSidebar}
                setFilter={this.setFilter}
                selected={selectedQuestion} />
            </div>
            <div className='col-md-8'>
              <div className='ql-edit-preview-container affix'>
              { selectedQuestion
                ? <div>
                  {canEdit
                    ? <div>
                        <button className='btn btn-default'
                           onClick={() => { this.doneEditing() }}
                           data-toggle='tooltip'
                           data-placement='left'>
                           Done editing
                        </button>
                        <div id='ckeditor-toolbar' />
                        <div className='ql-edit-item-container'>
                          <QuestionEditItem
                            courseId={this.props.courseId}
                            question={selectedQuestion}
                            deleted={this.questionDeleted}
                            onSave={this.editQuestion}
                            metadata autoSave />
                          </div>
                      </div>
                    : ''
                  }

                  <h3>Preview Question</h3>
                  { this.state.selectedLibrary !== 'library'
                    ? <div>
                        <button className='btn btn-default'
                           onClick={() => { this.doneEditing() }}
                           data-toggle='tooltip'
                           data-placement='left'>
                           Close Preview
                        </button>
                       { canToggleApprove ?
                           <button className='btn btn-default'
                             onClick={() => { this.toggleApproveQuestion(selectedQuestion) }}
                             data-toggle='tooltip'
                             data-placement='left'>
                             {selectedQuestion.approved ? 'Un-approve ' : 'Approve '} for course
                           </button>
                         : ''
                       }
                       { canCopy ?
                           <button className='btn btn-default'
                             onClick={() => { this.copyToLibrary(selectedQuestion) }}
                             data-toggle='tooltip'
                             data-placement='left'>
                             Copy to library
                           </button>
                         : ''
                       }
                       { canTogglePublic ?
                           <button className='btn btn-default'
                              onClick={() => { this.toggleQuestionPublic(selectedQuestion) }}
                              data-toggle='tooltip'
                              data-placement='left'>
                              {selectedQuestion.public ? 'Hide from public' : 'Make public'}
                           </button>
                          : ''
                       }
                      </div>
                    : ''
                  }
                  <div className='ql-preview-item-container'>
                    <QuestionDisplay question={selectedQuestion} forReview readonly />
                  </div>
                </div>
                : ''
              }
            </div>
            </div>
          </div>
        </div>
      </div>)
  }
}



export const QuestionsLibrary = withTracker((props) => {

  const handle =  Meteor.subscribe('courses.single', props.courseId)
  const course = Courses.findOne({_id: props.courseId})

  return {
    loading: !handle.ready(),
    course: course
  }

})(_QuestionsLibrary)
