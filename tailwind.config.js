const plugin = require('tailwindcss/plugin');

module.exports = {
  theme: {
    extend: {
      boxShadow: {
        outline: '0 0 0 3px rgba(72, 187, 120, 0.4)'
      },
      colors: {
        dblue: {
          100: '#E6F0FF',
          200: '#BFDAFF',
          300: '#99C3FF',
          400: '#4D97FF',
          500: '#006AFF',
          600: '#005FE6',
          700: '#004099',
          800: '#003073',
          900: '#00204D'
        }
      }
    },
    customForms: (theme) => ({
      default: {
        'input, textarea, multiselect, select, radio, checkbox': {
          backgroundColor: theme('colors.gray.200'),
          '&:focus': {
            borderColor: theme('colors.green.500'),
            boxShadow: theme('boxShadow.outline')
          }
        },
        radio: {
          iconColor: theme('colors.green.500'),
          icon:
            '<svg fill="#48bb78" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="3"/></svg>'
        },
        'select, checkbox, radio': {
          iconColor: theme('colors.green.500')
        }
      }
    })
  },
  variants: {
    borderColor: ['responsive', 'hover', 'focus', 'dark', 'dark-hover'],
    backgroundColor: [
      'responsive',
      'hover',
      'focus',
      'even',
      'group-hover',
      'dark',
      'dark-hover'
    ],
    textColor: ['responsive', 'hover', 'focus', 'dark', 'dark-hover']
  },
  plugins: [
    require('@tailwindcss/custom-forms'),
    // `e` function escapes class names to handle non-standard characters
    plugin(function ({ addVariant, e }) {
      addVariant('dark', ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          return `.dark-mode .${e(`dk${separator}${className}`)}`;
        });
      });
    }),
    plugin(function ({ addVariant, e }) {
      addVariant('dark-hover', ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          return `.dark-mode .${e(`dk-hover${separator}${className}`)}:hover`;
        });
      });
    })
  ]
};
