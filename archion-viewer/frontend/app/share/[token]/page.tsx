import SharedViewerGate from "@/components/SharedViewerGate";

interface SharedViewerPageProps {
    params: Promise<{ token: string }>;
}

export default async function SharedViewerPage({ params }: SharedViewerPageProps) {
    const { token } = await params;
    return <SharedViewerGate token={token} />;
}

export async function generateMetadata({ params }: SharedViewerPageProps) {
    const { token } = await params;
    return {
        title: "Shared Model — Archion Viewer",
        description: "View a securely shared 3D architectural model via Archion Viewer.",
        robots: { index: false, follow: false },
    };
}
