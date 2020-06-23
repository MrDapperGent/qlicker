// QLICKER
// Author: Enoch T <me@enocht.am>
//
// student_session_results.jsx: page for students to review previous sessions

import React, { Component } from 'react'
import { withTracker }  from 'meteor/react-meteor-data'
import _ from 'underscore'
import { Courses } from '../../api/courses'
import { Grades } from '../../api/grades'
import { Sessions } from '../../api/sessions'
import { Questions } from '../../api/questions'
import { Responses } from '../../api/responses'

import { QuestionWithResponseArray } from '../QuestionWithResponseArray'
import { StudentSessionResults } from '../StudentSessionResults'

class _StudentSessionResultsPage extends Component {

  constructor (props) {
    super(props)

    this.state = { questionIndex: 0,
                   showAllAtOnce: false
                  }

    this.incrementQuestion = this.incrementQuestion.bind(this)
  }

  incrementQuestion (increment) {
    const newIndex = this.state.questionIndex + increment
    if (newIndex < this.props.questions.length && newIndex >= 0) {
      this.setState({ questionIndex: newIndex })
    }
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    if (this.props.questions.length < 1) return <div> No questions in session </div>

    const questionToView = _(this.props.questions).findWhere( {_id:this.props.session.questions[this.state.questionIndex]} )
    const incrementQuestion = () => this.incrementQuestion(1)
    const decrementQuestion = () => this.incrementQuestion(-1)
    const mark = _(this.props.grade.marks).findWhere({ questionId:questionToView._id })
    const feedback = mark.feedback
    const points = mark.points+"/"+mark.outOf+" points"

    const toggleShowAll = () => this.setState({ showAllAtOnce:!this.state.showAllAtOnce })

    return (
      <div className='container ql-results-page'>

        <div className='ql-card'>
          <div className='ql-header-bar'>
            <div className='ql-review-header-bar'>
              {this.props.session.name} (<span className='uppercase'>{this.props.course.fullCourseCode()}</span>)
              { this.props.grade ?
                  <div>
                    Grade: {this.props.grade.value.toFixed(0)}% Participation: {this.props.grade.participation.toFixed(0)}%
                  </div>
                : ''
              }
            </div>
          </div>
          <div className='ql-card-content'>
            <ul className='nav nav-tabs'>
              <li role='presentation' className={ !this.state.showAllAtOnce ? 'active' : ''}>
                <a role='button' onClick={() => this.setState({ showAllAtOnce:false}) }>One question</a>
              </li>
              <li role='presentation' className={ this.state.showAllAtOnce ? 'active' : ''}>
                <a role='button' onClick={() => this.setState({ showAllAtOnce:true }) }>All questions</a>
              </li>
            </ul>
            {this.state.showAllAtOnce ?
                <StudentSessionResults session={this.props.session} studentId={this.props.userId} />
              : <div>
                  <div className='ql-review-qControl-container'>
                    <div className='ql-review-qControl-title'>
                      Q{this.state.questionIndex + 1}/{this.props.questions.length} ({points})
                    </div>
                    { this.props.questions.length > 1 ?
                      <div className='ql-review-qControl-controls'>
                        <div className='btn-group btn-group-justified'>
                          <div className='btn-group'>
                            <button className='btn btn-primary' onClick={decrementQuestion} disabled={this.state.questionIndex <= 0}>
                                <span className='glyphicon glyphicon-chevron-left' /> Previous question
                            </button>
                          </div>
                          <div className='btn-group'>
                            <button className='btn btn-primary' onClick={incrementQuestion} disabled={this.state.questionIndex >= this.props.questions.length - 1}>
                                Next question <span className='glyphicon glyphicon-chevron-right' />
                            </button>
                          </div>
                        </div>
                      </div>
                      : ''
                    }

                  </div>
                  <div className='ql-review-question'>
                    <QuestionWithResponseArray question={questionToView} responses={questionToView.studentResponses} solutionScroll/>
                  </div>

                  {feedback ?
                    <div className='ql-review-feedback'> Feedback: {feedback} </div>
                    : ''
                  }
                </div>
            }


          </div>
        </div>
      </div>
    )
  }

}

// meteor reactive data container
export const StudentSessionResultsPage = withTracker((props) => {
  const handle = Meteor.subscribe('userData') &&
    Meteor.subscribe('courses') &&
    Meteor.subscribe('sessions.single', props.sessionId) &&
    Meteor.subscribe('grades.forSession', props.sessionId) &&
    Meteor.subscribe('questions.forReview', props.sessionId) &&
    Meteor.subscribe('responses.forSession', props.sessionId)

  const userId = Meteor.userId()
  const session = Sessions.findOne(props.sessionId)
  const course = Courses.findOne(session.courseId)
  const grade = Grades.findOne({sessionId:props.sessionId,  userId: userId, visibleToStudents: true })
  const questions= Questions.find({ _id: { $in: session.questions || [] } }).fetch()

  questions.map((question) => {
    question.studentResponses = Responses.find({ studentUserId:userId , questionId: question._id }).fetch()
  })


  return {
    course: course,
    session: session,
    loading: !handle.ready(),
    grade: grade,
    userId: userId,
    questions: questions
  }
})(_StudentSessionResultsPage)
