// QLICKER
// Author: Enoch T <me@enocht.am>
//
// ChangePasswordModal.jsx: modal for password change

import React from 'react'

import { ControlledForm } from '../ControlledForm'


export class ChangePasswordModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = { }
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.refs.newPasswordForm.reset()
    this.setState({})
    this.props.done()
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for enroll form. Calls Accounts.changePassword
   */
  handleSubmit (e) {
    super.handleSubmit(e)

    if (Meteor.isTest) {
      this.props.done()
    }

    if (!this.state.verify || !this.state.new) {
      return alertify.error('Error: please enter a password')
    }

    if (this.state.new !== this.state.verify) {
      return alertify.error('Error: passwords don\'t match')
    }

    Accounts.changePassword(this.state.current, this.state.new, (e) => {
      if (e) return alertify.error('Error: couldn\'t change password')
      alertify.success('Password changed')
      this.done()
    })
  }

  render () {
    return (<div className='ql-modal-container' onClick={this.done}>
      <div className='ql-modal ql-modal-newemail container' onClick={this.preventPropagation}>
        <h2>Change Password</h2>
        <form ref='newPasswordForm' onSubmit={this.handleSubmit}>

          <label>Current Password:</label>
          <input type='password' className='form-control' data-name='current' onChange={this.setValue} /><br />

          <label>New Password:</label>
          <input type='password' className='form-control' data-name='new' onChange={this.setValue} /><br />

          <label>Verify Password:</label>
          <input type='password' className='form-control' data-name='verify' onChange={this.setValue} /><br />

          <div className='ql-buttongroup'>
            <a className='btn btn-default' onClick={this.done}>Cancel</a>
            <input className='btn btn-default' type='submit' id='submit' />
          </div>
        </form>
      </div>
    </div>)
  } //  end render

} // end ChangePasswordModal


