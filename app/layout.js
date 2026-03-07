import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import "./globals.css";

const fontSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-serif" });
const fontSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const viewport = {
	themeColor: config.colors.main,
	width: "device-width",
	initialScale: 1,
};

export const metadata = getSEOTags();

export default function RootLayout({ children }) {
	return (
		<html
			lang="en"
			data-theme={config.colors.theme}
			className={`${fontSans.variable} ${fontSerif.variable} font-sans`}
		>
			<body>
				<ClientLayout>{children}</ClientLayout>
			</body>
		</html>
	);
}
