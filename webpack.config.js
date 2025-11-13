const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
	// =====================================================
	// 1️⃣ Entry Points – Frontend, Kiosk & Produktion+Verkauf
	// =====================================================
	entry: {
		frontend: path.resolve(__dirname, "src/js/frontend.js"),
		kiosk: path.resolve(__dirname, "src/js/kiosk.js"),
		produktion: path.resolve(__dirname, "src/js/produktion-verkauf.js"),
		verpflegung: "./src/js/verpflegung.js",
	},

	// =====================================================
	// 2️⃣ Output
	// =====================================================
	output: {
		path: path.resolve(__dirname, "build"),
		filename: "[name].js",
		library: "udReservation",
		libraryTarget: "window",
		clean: true,
	},

	// =====================================================
	// 3️⃣ Module Rules
	// =====================================================
	/*module: {
		rules: [
			// 🔹 JavaScript
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env"],
					},
				},
			},

			// 🔹 SCSS
			{
				test: /\.scss$/,
				use: [
					MiniCssExtractPlugin.loader,
					"css-loader",
					{
						loader: "sass-loader",
						options: {
							sourceMap: true,
							sassOptions: {
								includePaths: [path.resolve(__dirname, "src/css")],
							},
						},
					},
				],
			},
		],

	},
*/
	module: {
		rules: [
			// 🔹 JavaScript
			{
				test: /\.m?js$/,
				exclude: /node_modules/, // reicht jetzt – vendor-Pfad wird verarbeitet
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env"],
					},
				},
			},

			// 🔹 Reine CSS-Dateien (z. B. Flatpickr)
			{
				test: /\.css$/i,
				use: [MiniCssExtractPlugin.loader, "css-loader"],
			},

			// 🔹 SCSS
			{
				test: /\.scss$/,
				use: [
					MiniCssExtractPlugin.loader,
					"css-loader",
					{
						loader: "sass-loader",
						options: {
							sourceMap: true,
							sassOptions: {
								includePaths: [
									path.resolve(__dirname, "src/css"),
								],
							},
						},
					},
				],
			},

			// 🔹 SVG als Inline-Text (z. B. für Icons)
			{
				test: /\.svg$/i,
				type: "asset/source",
			},
		],
	},

	// =====================================================
	// 4️⃣ Resolve – Dateiendungen
	// =====================================================
	resolve: {
		extensions: [".js", ".scss"],
	mainFields: ["browser", "module", "main"],
	fullySpecified: false,
	},

	// =====================================================
	// 5️⃣ Plugins
	// =====================================================
	plugins: [
		new MiniCssExtractPlugin({
			filename: "[name].css", // erzeugt frontend.css, kiosk.css, produktion.css
		}),
	],

	// =====================================================
	// 6️⃣ Optimierung
	// =====================================================
	optimization: {
		splitChunks: {
			chunks: "all",
		},
	},

	// =====================================================
	// 7️⃣ WordPress Externals
	// =====================================================
	externals: {
		"@wordpress/api-fetch": ["wp", "apiFetch"],
		"@wordpress/element": ["wp", "element"],
		"@wordpress/components": ["wp", "components"],
	},

	// =====================================================
	// 8️⃣ Stats
	// =====================================================
	stats: {
		errorDetails: true,
	},
};
