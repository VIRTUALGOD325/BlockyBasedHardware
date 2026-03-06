import { compilerManager } from "../lib/CompilerManager.js";

/* POST /api/upload — compile only (upload happens via browser Web Serial) */
export const handleUpload = async (req, res) => {
    const { code, port } = req.body;

    if (!code) {
        return res.status(400).json({
            success: false,
            error: "Missing 'code' in request body."
        });
    }

    try {
        console.log(`[API] Received compile request for ${port || 'unknown port'}`);

        // Ensure arduino core is installed
        await compilerManager.ensureCoreInstalled();

        // Compile only — Docker container has no USB access,
        // so we just verify the code compiles successfully
        await compilerManager.compileOnly(code);

        res.json({
            success: true,
            message: "Code compiled and verified successfully!"
        });

    } catch (error) {
        console.error("Compile handler failed:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Unknown error during compilation."
        });
    }
};
