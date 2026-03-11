module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        ubuntu: ["Playwrite CA", "cursive"],
      },
    },
  },
  plugins: [],
}

// main.js

// Make sure Tailwind is loaded before running this
if (typeof tailwind !== "undefined") {
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          ubuntu: ["Playwrite CA", "cursive"], // your custom font
          exo: ["Exo 2", "sans-serif"],
        },
      },
    },
  };
} else {
  console.error("Tailwind is not loaded yet.");
}


// Configure Tailwind to use both fonts
  tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        ubuntu: ['Ubuntu', 'sans-serif'],
                        exo: ['"Exo 2"', 'sans-serif'],
                    },
                    textShadow: {
                        'default': '2px 2px 4px rgba(0, 0, 0, 0.3)',
                        'lg': '4px 4px 8px rgba(0, 0, 0, 0.4)',
                        'xl': '4px 4px 16px rgba(0, 0, 0, 0.5)',
                    }
                },
            },
        }