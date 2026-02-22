import { Outfit } from "next/font/google";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const font = Outfit({ subsets: ["latin"] });

export const viewport = {
	themeColor: config.colors.main,
	width: "device-width",
	initialScale: 1,
};

export const metadata = getSEOTags();

import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
	return (
		<ClerkProvider>
			<html
				lang="en"
				data-theme={config.colors.theme}
				className={font.className}
			>
				<body>
					<ClientLayout>{children}</ClientLayout>
					<Analytics />
				</body>
			</html>
		</ClerkProvider>
	);
}
