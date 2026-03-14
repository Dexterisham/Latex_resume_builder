/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                neo: {
                    bg: '#fbf7f1',
                    pink: '#ff90e8',
                    yellow: '#ffc900',
                    blue: '#90a8ff',
                    green: '#23a094',
                    border: '#000000',
                    text: '#000000'
                }
            },
            boxShadow: {
                'neo': '4px 4px 0px 0px rgba(0,0,0,1)',
                'neo-hover': '2px 2px 0px 0px rgba(0,0,0,1)',
                'neo-focus': '1px 1px 0px 0px rgba(0,0,0,1)',
                'neo-xl': '8px 8px 0px 0px rgba(0,0,0,1)',
                'neo-brutal': '6px 6px 0px 0px #000'
            },
            fontFamily: {
                'sans': ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                'mono': ['"Space Mono"', 'ui-monospace', 'monospace']
            }
        },
    },
    plugins: [],
}
