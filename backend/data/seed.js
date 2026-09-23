/**
 * Seed data for all 5 drivers from the UrbanDash spec.
 * Conditions array can contain: "PEAK", "RAIN", "long-distance", "REJECTED"
 */

const seedDrivers = [
  {
    driverId: 'D-101',
    name: 'Ravi',
    shifts: [{ login: '09:00', logout: '15:00', label: 'Full Shift' }],
    deliveries: [
      { number: 1,  time: '09:20', distanceKm: 3.2, tip: 35,  conditions: ['normal'] },
      { number: 2,  time: '09:55', distanceKm: 5.1, tip: 0,   conditions: ['normal'] },
      { number: 3,  time: '10:30', distanceKm: 2.8, tip: 20,  conditions: ['normal'] },
      { number: 4,  time: '10:50', distanceKm: null, tip: 0,  conditions: ['REJECTED'], note: 'personal emergency' },
      { number: 5,  time: '11:30', distanceKm: 4.5, tip: 0,   conditions: ['normal'] },
      { number: 6,  time: '12:15', distanceKm: 6.0, tip: 50,  conditions: ['PEAK'] },
      { number: 7,  time: '13:00', distanceKm: 7.2, tip: 0,   conditions: ['PEAK'] },
      { number: 8,  time: '13:45', distanceKm: 3.1, tip: 10,  conditions: ['PEAK'] },
      { number: 9,  time: '14:30', distanceKm: 9.5, tip: 0,   conditions: ['RAIN', 'long-distance'] },
      { number: 10, time: '15:00', distanceKm: 4.0, tip: 25,  conditions: ['RAIN'] },
    ],
  },

  {
    driverId: 'D-102',
    name: 'Sunil',
    shifts: [{ login: '11:00', logout: '21:30', label: 'Full Shift' }],
    deliveries: [
      { number: 1,  time: '11:20', distanceKm: 4.5, tip: 0,   conditions: ['normal'] },
      { number: 2,  time: '12:00', distanceKm: 3.0, tip: 0,   conditions: ['PEAK'] },
      { number: 3,  time: '12:30', distanceKm: 5.5, tip: 40,  conditions: ['PEAK'] },
      { number: 4,  time: '13:15', distanceKm: 2.1, tip: 0,   conditions: ['PEAK'] },
      { number: 5,  time: '13:50', distanceKm: 8.5, tip: 0,   conditions: ['PEAK', 'long-distance'] },
      { number: 6,  time: '14:20', distanceKm: 6.0, tip: 30,  conditions: ['RAIN'] },
      { number: 7,  time: '15:00', distanceKm: null, tip: 0,  conditions: ['REJECTED'] },
      { number: 8,  time: '15:30', distanceKm: 3.8, tip: 0,   conditions: ['normal'] },
      { number: 9,  time: '16:15', distanceKm: 4.0, tip: 0,   conditions: ['normal'] },
      { number: 10, time: '17:00', distanceKm: 7.0, tip: 0,   conditions: ['normal'] },
      { number: 11, time: '18:00', distanceKm: null, tip: 0,  conditions: ['REJECTED'] },
      { number: 12, time: '19:00', distanceKm: 5.0, tip: 60,  conditions: ['PEAK'] },
      { number: 13, time: '19:45', distanceKm: 3.5, tip: 0,   conditions: ['PEAK'] },
      { number: 14, time: '20:30', distanceKm: 10.2, tip: 100, conditions: ['PEAK', 'long-distance'] },
      { number: 15, time: '21:15', distanceKm: 2.0, tip: 0,   conditions: ['PEAK'] },
    ],
  },

  {
    driverId: 'D-103',
    name: 'Meera',
    shifts: [
      { login: '08:00', logout: '12:00', label: 'Morning' },
      { login: '17:00', logout: '21:00', label: 'Evening' },
    ],
    deliveries: [
      // Morning
      { number: 1,  time: '08:30', distanceKm: 3.0, tip: 0,   conditions: ['normal'] },
      { number: 2,  time: '09:15', distanceKm: 4.0, tip: 15,  conditions: ['normal'] },
      { number: 3,  time: '09:50', distanceKm: 5.5, tip: 0,   conditions: ['normal'] },
      { number: 4,  time: '10:30', distanceKm: 3.2, tip: 0,   conditions: ['normal'] },
      { number: 5,  time: '11:15', distanceKm: 6.0, tip: 20,  conditions: ['normal'] },
      // Evening
      { number: 6,  time: '17:30', distanceKm: 4.0, tip: 0,   conditions: ['normal'] },
      { number: 7,  time: '18:15', distanceKm: 3.5, tip: 25,  conditions: ['normal'] },
      { number: 8,  time: '19:00', distanceKm: 7.5, tip: 0,   conditions: ['PEAK'] },
      { number: 9,  time: '19:45', distanceKm: 2.5, tip: 30,  conditions: ['PEAK'] },
      { number: 10, time: '20:30', distanceKm: 9.0, tip: 0,   conditions: ['PEAK', 'long-distance'] },
    ],
  },

  {
    driverId: 'D-104',
    name: 'Arjun',
    shifts: [{ login: '12:00', logout: '14:00', label: 'Full Shift' }],
    deliveries: [
      { number: 1, time: '12:20', distanceKm: 3.0, tip: 0,   conditions: ['PEAK'] },
      { number: 2, time: '12:50', distanceKm: null, tip: 0,  conditions: ['REJECTED'] },
      { number: 3, time: '13:30', distanceKm: 5.0, tip: 20,  conditions: ['PEAK'] },
      { number: 4, time: '13:55', distanceKm: null, tip: 0,  conditions: ['REJECTED'] },
    ],
  },

  {
    driverId: 'D-105',
    name: 'Kabir',
    shifts: [{ login: '19:00', logout: '23:00', label: 'Full Shift' }],
    deliveries: [
      { number: 1, time: '19:15', distanceKm: 4.0,  tip: 0,   conditions: ['PEAK'] },
      { number: 2, time: '19:45', distanceKm: 3.5,  tip: 50,  conditions: ['PEAK'] },
      { number: 3, time: '20:20', distanceKm: 5.0,  tip: 0,   conditions: ['PEAK'], disputed: true, note: 'Disputed by customer — wrong items. Under investigation.' },
      { number: 4, time: '20:50', distanceKm: 6.0,  tip: 30,  conditions: ['PEAK'] },
      { number: 5, time: '21:15', distanceKm: 8.5,  tip: 0,   conditions: ['long-distance'] },
    ],
  },
];

module.exports = seedDrivers;
