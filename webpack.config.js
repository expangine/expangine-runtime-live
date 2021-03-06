const path = require('path');

const ROOT = path.resolve( __dirname, 'src' );
const DESTINATION = path.resolve( __dirname, 'dist' );

module.exports = {
    context: ROOT,

    entry: {
      'expangine-runtime-live': './index.ts'
    },
    
    output: {
        filename: '[name].js',
        path: DESTINATION,
        libraryTarget: 'umd',
        library: '[name]',
    },

    mode: 'development',

    optimization: {
      usedExports: true,
      mangleExports: false,
    },

    resolve: {
        extensions: ['.ts', '.js'],
        modules: [
            ROOT,
            'node_modules'
        ]
    },

    externals: {
      'expangine-runtime': 'expangine-runtime',
      'metaphone': 'metaphone',
    },

    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.ts$/,
                exclude: /node_modules/,
                use: 'tslint-loader'
            },
            {
                test: /\.ts$/,
                exclude: [ /node_modules/ ],
                use: 'ts-loader'
            }
        ]
    },

    devtool: 'source-map',
    devServer: {}
};