const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  purge: {
    layers: ['utilities'],
    content: ['./src/**/*.tsx', './src/**/*.ts', './src/**/*.css']
  },
  theme: {
    colors: {
      ...defaultTheme.colors,
      green: {
        100: '#f0fff4',
        200: '#c6f6d5',
        300: '#9ae6b4',
        400: '#68d391',
        500: '#48bb78',
        600: '#38a169',
        700: '#2f855a',
        800: '#276749',
        900: '#22543d'
      },
      gray: colors.coolGray,
      transparent: 'transparent'
    }
  },
  plugins: [require('@tailwindcss/forms')]
};
