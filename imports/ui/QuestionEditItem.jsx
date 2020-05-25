// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionEditItem.jsx: component for editing/create used in session creation

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'underscore'

import Select, { Creatable } from 'react-select'
import 'react-select/dist/react-select.css'

import { Editor } from './Editor'
import { RadioPrompt } from './RadioPrompt'

//import { ShareModal } from './modals/ShareModal'

import { defaultSessionOptions, defaultQuestion } from '../api/questions'


// constants
import { MC_ORDER, TF_ORDER, SA_ORDER, QUESTION_TYPE, QUESTION_TYPE_STRINGS, isAutoGradeable, ROLES } from '../configs'

/**
 * React Component for editing an individual question
 * @prop {Question} question - question object
 * @prop {Func} [onNewQuestion] - callback when a new question is save to database
 * @prop {Boolean} [metadata] - wether element should display top metadata (tags, make public buttons) row
 * @prop {Func} [deleted] - callback when delete button pressed
 * @prop {Boolean} [autoSave] - should component save change automatically
 */
export class QuestionEditItem extends Component {

  constructor (props) {
    super(props)

    // binding methods for calling within react context
    this.onEditorStateChange = this.onEditorStateChange.bind(this)
    this.onEditorSolutionChange = this.onEditorSolutionChange.bind(this)
    // this.uploadImageCallBack = this.uploadImageCallBack.bind(this)
    this.addAnswer = this.addAnswer.bind(this)
    this.setOptionState = this.setOptionState.bind(this)
    this.markCorrect = this.markCorrect.bind(this)
    this.addTag = this.addTag.bind(this)
    this.addTagString = this.addTagString.bind(this)
    this.changeType = this.changeType.bind(this)
    this.saveQuestion = this.saveQuestion.bind(this)
    this.togglePublic = this.togglePublic.bind(this)
    //this.togglePrivate = this.togglePrivate.bind(this)
    this.deleteQuestion = this.deleteQuestion.bind(this)
    //this.duplicateQuestion = this.duplicateQuestion.bind(this)
    //this.toggleShareModal = this.toggleShareModal.bind(this)
  //  this.setCourse = this.setCourse.bind(this)
    this.setPoints = this.setPoints.bind(this)
    this.setToleranceNumerical = this.setToleranceNumerical.bind(this)
    this.setCorrectNumerical = this.setCorrectNumerical.bind(this)
    this.setMaxAttempts = this.setMaxAttempts.bind(this)
    this._DB_saveQuestion = _.debounce(() => { if (this.props.autoSave) this.saveQuestion() }, 1600)
    //this.shareQuestion = this.shareQuestion.bind(this)
    this.numericalAnswerEditor = this.numericalAnswerEditor.bind(this)
    //Set state
    this.state = {
      tagSuggestions : [],
    }
    // if editing pre-exsiting question
    if (this.props.question) {
      this.state.question = this.props.question
      //this.state.showShareModal = false
      if (this.props.sessionId && !this.props.question.sessionOptions) {
        this.state.question.sessionOptions = defaultSessionOptions
      }
      this.state.currentAnswer = this.state.question.options ? this.state.question.options.length : 0
      switch (this.state.question.type) {
        case QUESTION_TYPE.MC:
          this.answerOrder = MC_ORDER
          break
        case QUESTION_TYPE.MS:
          this.answerOrder = MC_ORDER
          break
        case QUESTION_TYPE.TF:
          this.answerOrder = TF_ORDER
          break
        case QUESTION_TYPE.SA:
          this.answerOrder = SA_ORDER
          break
        case QUESTION_TYPE.NU:
          this.answerOrder = SA_ORDER
          break
      }
    } else { // if adding new question
      this.state.question = defaultQuestion
      this.state.question.creator = Meteor.userId()
      this.state.question.owner = Meteor.userId()
      // tracking for adding new mulitple choice answers
      this.state.currentAnswer = 0
      this.answerOrder = MC_ORDER
    }
    if (this.props.courseId && this.state.question.courseId !== this.props.courseId){
      this.state.question.courseId = this.props.courseId
    }

  } // end constructor

  componentDidMount() {
    Meteor.call('questions.possibleTags', this.props.courseId, (e, tags) => {
      // non-critical, if e: silently fail
      let tagSuggestions = []
      tags.forEach((t) => {
        tagSuggestions.push({ value: t, label: t.toUpperCase() })
      })
      this.setState({tagSuggestions: tagSuggestions})
      //this.forceUpdate()
    })
  }

  componentWillReceiveProps (nextProps) {
    if( nextProps.question && nextProps.question._id !== this.state.question._id){
      this.setState({ question: nextProps.question })
    }
    //this.setCourse(nextProps.question.courseId)
  }
   /**
   * For a question in a session, change the number of points that it is worth
   * @param {Object} event
   */
  setPoints (e) {
    const points = parseFloat(e.target.value)
    let question = this.state.question
    question.sessionOptions.points = points
    this.setState({question: question}, () => {
      this._DB_saveQuestion()
    })
  }
  /**
  * For a question in a session, change the number of points that it is worth
  * @param {Object} event
  */
  setMaxAttempts (e) {
    const maxAttempts = parseInt(e.target.value)
    let question = this.state.question
    question.sessionOptions.maxAttempts = maxAttempts
    let attemptWeights = [1.0]
   // Each attempt is worth half as much as the previous one
    for (let i = 1; i < maxAttempts; i++) {
      attemptWeights.push(attemptWeights[i - 1] / 2.0)
    }
    question.sessionOptions.attemptWeights = attemptWeights
    this.setState({question: question}, () => {
      this._DB_saveQuestion()
    })
  }

  /**
   * change question type to MC, TF or SA
   * @param {Number} newValue
   */
  changeType (newValue) {
    let question = this.state.question
    const oldType = this.state.question.type
    question.type = parseInt(newValue)

    const retainOptions = (oldType === QUESTION_TYPE.MC && question.type === QUESTION_TYPE.MS) ||
      (question.type === QUESTION_TYPE.MC && oldType === QUESTION_TYPE.MS)

    const stateUpdater = { question: question }
    if (!retainOptions) {
      if (oldType === QUESTION_TYPE.SA || oldType === QUESTION_TYPE.TF || oldType === QUESTION_TYPE.NU) {
        stateUpdater.question.options = []
      } else if (this.state.question.options && this.state.question.options.length > 0) {
        if (this.state.question.options.length === 1 && this.state.question.options[0].content === '') {
          stateUpdater.question.options = []
        } else {
          const c = confirm('You are about to clear your answer options for this question. Do you want to proceed?')
          if (c) stateUpdater.question.options = []
          else return
        }
      }
    } else {
      const options = this.state.question.options
      options.forEach((a, i) => {
        if (i === 0) options[i].correct = true
        else options[i].correct = false
      })
    }

    if (question.type === QUESTION_TYPE.TF || question.type === QUESTION_TYPE.SA || question.type === QUESTION_TYPE.NU || !retainOptions){
      stateUpdater.currentAnswer = 0
    }

    this.setState(stateUpdater, () => {
      if (question.type === QUESTION_TYPE.TF) {
        this.answerOrder = TF_ORDER
        this.addAnswer(null, null, false, () => {
          this.addAnswer(null, null, false)
        })
      } else if (question.type === QUESTION_TYPE.SA|| question.type === QUESTION_TYPE.NU) {
        this.answerOrder = SA_ORDER
        this.addAnswer(null, null, true)
      } else if (!retainOptions) {
        this.answerOrder = MC_ORDER
        this.addAnswer(null, null, true)
      }
      this._DB_saveQuestion()
    })
  }

  /**
   * save tags to the DB
   * @param {Array} tags
   */
  addTag (tags) {
    const _tags = tags
    _tags.forEach((t) => {
      t.label = t.label.toUpperCase()
      t.value = t.value.toUpperCase()
    })
    let question = this.state.question
    question.tags = _tags
    if (this.state.question) {
      this.setState({ question: question }, () => {
        this._DB_saveQuestion()
      })
    }
  }

  /**
   * add tag to state
   * @param {String} tag
   */
  addTagString (tag) {
    const newTag = {label: tag,
      value: tag}
    let tags = this.state.question.tags
    tags.push(newTag)
    this.addTag(tags)
  }

  /**
   * Update wysiwyg contents for actual question in state
   * @param {Object} content
   */
  onEditorStateChange (content, plainText) {
    let question = this.state.question
    question.content = content
    question.plainText = plainText
    this.setState({ question: question }, () => {
      this._DB_saveQuestion()
    })
  }

  onEditorSolutionChange (solution, solution_plainText) {
    let question = this.state.question
    question.solution = solution
    question.solution_plainText = solution_plainText
    this.setState({question: question}, () => {
      this._DB_saveQuestion()
    })
  }
  /**
   * Update wysiwyg content in the state based on the answer
   * @param {String} answerKey
   * @param {Object} content
   */
  setOptionState (answerKey, content, plainText) {
    let question = this.state.question
    const i = _(question.options).findIndex({ answer: answerKey })
    if (i >= 0) {
      question.options[i].content = content
      question.options[i].plainText = plainText
      this.setState({question: question}, () => {
        this._DB_saveQuestion()
      })
    }
  } // end setOptionState

  /**
   * add answer option to MC, MS, and TF questions
   * @param {Event} _ - form event
   * @param {Event} e - form event
   * @param {Boolean} [wysiwyg = true] - answer option has wysiwyg content
   * @param {Callback} [done = null] - callback when done
   */
  addAnswer (_, e, wysiwyg = true, done = null) {
    const answerKey = this.answerOrder[this.state.currentAnswer]
    if (this.state.currentAnswer >= this.answerOrder.length) return
    let question = this.state.question
    question.options = this.state.question.options.concat([{
      correct: this.state.currentAnswer === 0,
      answer: answerKey,
      wysiwyg: wysiwyg
    }])
    const plusOne = this.state.currentAnswer + 1
    this.setState({ question: question, currentAnswer:plusOne }, () => {
      //this.currentAnswer++

      if (wysiwyg) this.setOptionState(answerKey, '', '')
      else this.setOptionState(answerKey, answerKey, answerKey)

      if (done) done()
    })
  } // end addAnswer

  /**
   * remove answer option to MC, MS, and TF questions
   * @param {String} answerKey
   */
  removeAnswer (answerKey) {
    if (this.state.question.options.length === 1) return
    const newOptions = []
    let resetCorrect = false

  //  this.currentAnswer--
    const minusOne = this.state.currentAnswer - 1
    this.setState({currentAnswer: minusOne})

    this.state.question.options.forEach(o => {
      if (answerKey !== o.answer) {
        const option = _.extend({}, o)
        newOptions.push(option)
      } else if (o.correct) { // delete option was marked as correct
        resetCorrect = true
      }
    })

    // reletter options
    newOptions.forEach((o, i) => {
      if (i === 0 && resetCorrect) o.correct = true
      o.answer = this.answerOrder[i]
    })
    let question = this.state.question
    question.options = []
    this.setState({ question: question }, () => {
      question.options = newOptions
      this.setState({ question: question }, this._DB_saveQuestion)
    })
  } // end removeAnswer

  /**
   * Set answer as correct in stae
   * @param {String} answerKey
   */
  markCorrect (answerKey) {
    let question = this.state.question

    if (this.state.question.type === QUESTION_TYPE.MS) {
      question.options.forEach((a, i) => {
        if (a.answer === answerKey) question.options[i].correct = !question.options[i].correct
      })
    } else {
      question.options.forEach((a, i) => {
        if (a.answer === answerKey) question.options[i].correct = true
        else question.options[i].correct = false
      })
    }

    this.setState({ question: question }, () => {
      this._DB_saveQuestion()
    })
  }

  togglePublic () {
    let question = this.state.question
    question.public = !this.state.question.public
    //if (question.public) question.private = false
    if (this.state) {
      this.setState({ question: question }, () => {
        this.saveQuestion()
      })
    }
  }

  setCorrectNumerical (e) {
    let question = this.state.question
    const points = parseFloat(e.target.value)
    if (question.type !== QUESTION_TYPE.NU) return
    question.correctNumerical = points
    this.setState({ question: question }, () => {
      this._DB_saveQuestion()
    })
  }

  setToleranceNumerical (e) {
    let question = this.state.question
    const points = parseFloat(e.target.value)
    if (question.type !== QUESTION_TYPE.NU) return
    question.toleranceNumerical = (Math.abs(points))
    this.setState({ question: question }, () => {
      this._DB_saveQuestion()
    })
  }

/*
  togglePrivate () {
    let question = this.state.question
    question.private = !this.state.question.private
    if (question.private) question.public = false
    if (this.state) {
      this.setState({ question: question }, () => {
        this.saveQuestion()
      })
    }
  }*/

  /**
   * Calls {@link module:questions~"questions.insert" questions.insert} to save question to db
   */
  saveQuestion (user) {
    let keysToOmit = []
    //If not exporting question
    if (!user) {
      user = Meteor.user()
    } else {
      keysToOmit.push(['owner'])
    }


    //Not sure when we need to extend the question to have an owner.
    /*
    let question = _.extend( {
      createdAt: new Date(),
      owner: user._id,
    }, _.omit(this.state.question, keysToOmit))
    */

    // Don't save until the type is saved:
    //if (question.options.length === 0 && question.type !== QUESTION_TYPE.SA) return
    let question = this.state.question
    if (this.props.sessionId) question.sessionId = this.props.sessionId
    if (this.props.courseId) question.courseId = this.props.courseId

    // insert (or edit)
    Meteor.call('questions.insert', question, (error, newQuestion) => {
      if (error) {
        alertify.error('Error: ' + error.error)
      } else {
        if (!this.state.question._id) {
          alertify.success('Question Saved')
          if (this.props.onNewQuestion) this.props.onNewQuestion(newQuestion._id)
        } else {
          alertify.success('Edits Saved')
        }
        this.setState({ question: newQuestion })
        if(this.props.onSave) this.props.onSave(newQuestion)
        return
      }
    })
  } // end saveQuestion

  deleteQuestion () {
    Meteor.call('questions.delete', this.state.question._id, (error) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question Deleted')
      if (this.props.deleted) this.props.deleted()
    })
  }
/*
  duplicateQuestion (user) {
    if ( this.state.question._id && (this.state.question.options.length !== 0 || this.state.question.type === QUESTION_TYPE.SA)) {
      Meteor.call('questions.duplicate', this.state.question, user._id)
    } else {
      alertify.error('Error: question must be saved')
    }
  }*/
/*
  toggleShareModal () {
    this.setState({ showShareModal: !this.state.showShareModal })
  }

  shareQuestion (email) {
    let question = _.extend({}, this.state.question)
    Meteor.call('questions.share', question, email, (err) => {
      if (err) alertify.error('Error sharing question')
      else alertify.success('Question shared')
    })
  }
*/


componentWillReceiveProps (nextProps) {
  if( nextProps.question && nextProps.question._id !== this.state.question._id){
    this.setState({ question: nextProps.question })
  }
  //this.setCourse(nextProps.question.courseId)
}

  /**
   * generate a answer option element row
   * @param {Answer} a
   */
  answerEditor (a) {
    if (!a) return <div>Loading</div>
    const changeHandler = (content, plainText) => {
      this.setOptionState(a.answer, content, plainText)
    }
    let item

    if (a.wysiwyg) {
      item = (
        <div>
          <div className='answer-option'>
            <span className='correct' onClick={() => this.markCorrect(a.answer)}>
              { a.correct ? <span className='glyphicon glyphicon-ok' /> : '' }
            </span>
            <span className='answer-key'>{ a.answer }</span>
            <Editor
              change={changeHandler}
              val={a.content}
              className='answer-editor'
              />

            <span
              onClick={() => this.removeAnswer(a.answer)}
              className='trash-icon glyphicon glyphicon-trash' />
          </div>
        </div>)
    } else {
      item = (<div className='answer-option'>
        <span className='correct' onClick={() => this.markCorrect(a.answer)}>
          { a.correct ? <span className='glyphicon glyphicon-ok' /> : '' }
        </span>
        <div className='answer-no-wysiwyg answer-editor'>
          <span>{ a.answer }</span>
        </div>
      </div>)
    }

    return (<div className={'small-editor-wrapper ' + (a.wysiwyg ? 'col-md-12' : 'col-md-6')} key={'answer_' + a.answer}>
      { item }
    </div>)
  } // end answerEditor

  shortAnswerEditor (a) {
    if (!a) return <div>Loading</div>
    const changeHandler = (content, plainText) => {
      this.setOptionState(a.answer, content, plainText)
    }

    return (<div className={'small-editor-wrapper col-md-12'} key={'answer_' + a.answer}>
      <div className='answer-option'>
        <Editor
          change={changeHandler}
          val={a.content}
          className='answer-editor'
        />
      </div>
    </div>)
  } // end shortAnswerEditor

  numericalAnswerEditor () {
    const minVal = (this.state.question.correctNumerical && this.state.question.toleranceNumerical) ? this.state.question.correctNumerical - this.state.question.toleranceNumerical : 0
    const maxVal = (this.state.question.correctNumerical && this.state.question.toleranceNumerical) ? this.state.question.correctNumerical + this.state.question.toleranceNumerical :0
    return (
      <div className='numerical-answer-editor'>
        <div className='ql-num-label'>
          Correct:
        </div>
        <input type='number'
          placeholder='Correct'
          step="any"
          onChange={this.setCorrectNumerical}
          value={this.state.question.correctNumerical} />
        <div className='ql-num-label'>
          Tolerance:
        </div>
        <input type='number'
          min={0}
          step="any"
          onChange={this.setToleranceNumerical}
          placeholder='Tolerance'
          value={this.state.question.toleranceNumerical} />
        { this.state.question.correctNumerical && this.state.question.toleranceNumerical ?
          <div className='ql-num-label'>
              (Allowed range: {parseFloat(minVal.toPrecision(12))} - {parseFloat(maxVal.toPrecision(12))})
          </div>
          :  ''
        }

      </div>)
  }

  render () {

    let editorRows = []
    if (this.state.question.type === QUESTION_TYPE.TF) {
      const row = <div key='row_0' className='row'>
        {this.answerEditor(this.state.question.options[0])}
        {this.answerEditor(this.state.question.options[1])}
      </div>
      editorRows.push(row)

    } else if (this.state.question.type !== QUESTION_TYPE.SA) {
      this.state.question.options.forEach((option, i) => {
        editorRows.push(<div key={'row_' + i} className='row'>
          { this.answerEditor(option) }
        </div>)
      })
    }

    let user = Meteor.user()
    // cannot create tags for the course if it's a student
    const selectOnly = user.isStudent(this.props.courseId) || !user.isInstructor(this.props.courseId)

    const radioOptions = [
      { value: QUESTION_TYPE.MC, label: QUESTION_TYPE_STRINGS[QUESTION_TYPE.MC] },
      { value: QUESTION_TYPE.MS, label: QUESTION_TYPE_STRINGS[QUESTION_TYPE.MS] },
      { value: QUESTION_TYPE.TF, label: QUESTION_TYPE_STRINGS[QUESTION_TYPE.TF] },
      { value: QUESTION_TYPE.SA, label: QUESTION_TYPE_STRINGS[QUESTION_TYPE.SA] },
      { value: QUESTION_TYPE.NU, label: QUESTION_TYPE_STRINGS[QUESTION_TYPE.NU] }
    ]


    return (
      <div className='ql-question-edit-item'>
        <div className='header'>
          { this.props.metadata
            ? <div className='row metadata-row'>
                <div className='col-md-10'>
                  <div className='btn-group'>
                    <button
                      className='btn btn-default'
                      onClick={this.deleteQuestion}>
                      Delete
                    </button>

                    { user.isInstructor(this.props.courseId)
                      ? <button
                          className='btn btn-default'
                          onClick={this.togglePublic}
                          data-toggle='tooltip'
                          data-placement='top'>
                          {this.state.question.public ? 'Hide from public' :  'Make public'}
                        </button>
                      : ''
                    }

                  </div>
                </div>
              </div>
            : '' }
          { this.props.sessionId
            ? <div className='row session-options'>
              <div className='qnumber'>
                  Question {this.props.questionNumber}
              </div>
              <div>
                <div className='qoption-label'>
                    Points:
                  </div>
                <input type='number'
                  min={0} step={0.5}
                  onChange={this.setPoints}
                  value={this.state.question.sessionOptions.points} />
              </div>
              {/* this.props.isQuiz && isAutoGradeable(this.state.question.type)
                  ? <div>
                    <div className='qoption-label'>
                        Max attempts (1-5):
                      </div>
                    <input type='number'
                      min={1} max={5} step={1}
                      onChange={this.setMaxAttempts}
                      value={this.state.question.sessionOptions.maxAttempts} />
                    { this.state.question.sessionOptions.maxAttempts > 1
                        ? <div> &nbsp;weights:
                            {this.state.question.sessionOptions.attemptWeights.map((w) => {
                              return (<div key={this.props.questionNumer + '_' + w}>&nbsp; {w.toFixed(2)} </div>)
                            })}
                        </div>
                        : ''
                      }
                  </div>
                  : ''
                */}
            </div>
            : ''
          }
          <div className='row'>
            <div className='col-md-12 metadata-row'>
              {selectOnly ? <Select
                name='tag-input'
                placeholder='Tags'
                multi
                value={this.state.question.tags && this.state.question.tags.length ? this.state.question.tags : ['']}
                options={this.state.tagSuggestions ? this.state.tagSuggestions : [{value: '', label: ''}]}
                onChange={this.addTag}
                /> : <Creatable
                  name='tag-input'
                  placeholder='Tags'
                  multi
                  value={this.state.question.tags}
                  options={this.state.tagSuggestions}
                  onChange={this.addTag}
                />
            }

            </div>

            <div className='col-md-12 question-row'>
              <Editor
                change={this.onEditorStateChange}
                val={this.state.question.content}
                className='question-editor'
                placeholder='Question?'
              />
              { this.props.onDeleteThis
                ? <span
                  onClick={this.props.onDeleteThis}
                  className='trash-icon glyphicon glyphicon-trash' />
                  : '' }
            </div>
          </div>
        </div>

        <RadioPrompt
          options={radioOptions}
          value={this.state.question.type}
          onChange={this.changeType} />

        { this.state.question.type !== QUESTION_TYPE.SA
          ? this.state.question.type !== QUESTION_TYPE.NU
            ? editorRows
            : this.numericalAnswerEditor()
          : ''
        }

        { (this.state.question.type === QUESTION_TYPE.MC || this.state.question.type === QUESTION_TYPE.MS) && this.answerOrder && this.state.currentAnswer < this.answerOrder.length
          ? <div className='row' onClick={this.addAnswer}>
            <div className='col-md-12'>
              <div className='add-question-row-item'>
                New Option <span className='glyphicon glyphicon-plus' />
              </div>
            </div>
          </div>
          : '' }
        <Editor
          change={this.onEditorSolutionChange}
          val={this.state.question.solution}
          className='solution-editor'
          placeholder='Solution' />
      </div>)
  } //  end render

} // end QuestionEditItem

QuestionEditItem.propTypes = {
  done: PropTypes.func,
  question: PropTypes.object,
  questionNumber: PropTypes.number,
  onNewQuestion: PropTypes.func,
  metadata: PropTypes.bool,
  deleted: PropTypes.func,
  isQuiz: PropTypes.bool,
  autoSave: PropTypes.bool,
  courseId: PropTypes.string.isRequired,
  //publicQuestionsRequireApproval: PropTypes.bool
}
