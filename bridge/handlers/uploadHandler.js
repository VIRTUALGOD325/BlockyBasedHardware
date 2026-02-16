import { compilerManager } from "../lib/CompilerManager.js";

/* POST /api/upload */
export const handleUpload = async (req, res) => {
    const { code, port } = req.body;

    if (!code || !port) {
        return res.status(400).json({
            success: false,
            error: "Missing 'code' or 'port' in request body."
        });
    }

    try {
        console.log(`[API] Received upload request for ${port}`);

        // Ensure core is installed (redundant check but safe)
        await compilerManager.ensureCoreInstalled();

        // The compileAndUpload method handles:
        // 1. Compile
        // 2. Disconnect Serial
        // 3. Upload
        // 4. Reconnect Serial
        await compilerManager.compileAndUpload(code, port);

        res.json({ success: true, message: "Upload successful!" });

    } catch (error) {
        console.error("Upload handler failed:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Unknown error during upload."
        });
    }
};
