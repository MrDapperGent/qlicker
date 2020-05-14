/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CourseListItem.jsx

import React from 'react';
import PropTypes from 'prop-types';

import { ListItem } from './ListItem'
import '../api/courses.js'

/**
 * React component list item for each course.
 * typically used on student and professor overview page.
 * @class
 * @augments ListItem
 * @prop {Course} course - course object
 * @prop {Func} [click] - list item click handler
 */
export class CourseListItem extends ListItem {

  render () {
    const controls = this.makeControls()
    const className = this.props.inactive ? 'ql-course-list-item-inactive ql-list-item  ' : 'ql-course-list-item ql-list-item '
    return (
      <div className={className + (this.props.click ? 'click' : '')} onClick={this.click}>
        { this.props.isTA ?
          <div>(TA)</div>
          :''
        }
        <span className='ql-course-code'>{ this.props.course.fullCourseCode() } </span>

        <span className='ql-course-name'>{ this.props.course.name }</span>

        <span className='ql-course-semester'>{ this.props.course.semester }</span>

        { this.props.controls ? <span className='controls'>{controls}</span> : '' }
      </div>)
  } //  end render

}

CourseListItem.propTypes = {
  course: PropTypes.object.isRequired,
  isTA: PropTypes.bool,
  click: PropTypes.func
}
