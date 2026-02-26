const Class = require('../models/Class')
const { DAYS, PERIODS } = require('../constants/timetable')

/*
  SIMPLE SAFE GENERATOR

  Rules:
  - distributes subjects evenly
  - avoids teacher double booking inside same class
  - skips BREAK periods
*/

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5)
}

module.exports = async function autoGenerateGridForClass(classId) {
  const classDoc = await Class.findById(classId)
    .populate('subjectMappings.subjectId')
    .populate('subjectMappings.teacherId')

  if (!classDoc) {
    throw new Error('Class not found')
  }

  const mappings = classDoc.subjectMappings || []

  if (!mappings.length) {
    throw new Error('No subjects assigned to class')
  }

  // create empty grid
  const grid = {}

  for (const d of DAYS) {
    grid[d] = {}
    for (const p of PERIODS) {
      grid[d][p] = {}
    }
  }

  // teacher busy tracker
  const teacherBusy = {}

  for (const d of DAYS) {
    teacherBusy[d] = {}
    for (const p of PERIODS) {
      teacherBusy[d][p] = new Set()
    }
  }

  const subjectsPool = shuffle([...mappings])

  let pointer = 0

  for (const day of DAYS) {
    for (const period of PERIODS) {

      if (period.includes('BREAK')) continue

      let attempts = 0
      let placed = false

      while (!placed && attempts < subjectsPool.length) {
        const mapping =
          subjectsPool[pointer % subjectsPool.length]

        pointer++
        attempts++

        const teacherId = mapping.teacherId?._id?.toString()

        // skip if no teacher
        if (!teacherId) continue

        if (teacherBusy[day][period].has(teacherId)) continue

        grid[day][period] = {
          subjectId: mapping.subjectId._id.toString()
        }

        teacherBusy[day][period].add(teacherId)
        placed = true
      }
    }
  }

  return grid
}