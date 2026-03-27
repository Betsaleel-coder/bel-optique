/**
 * VTO High-Performance Web Worker
 * Offloads AI processing from the Main Thread to prevent UI lag.
 */

// Import scripts if needed, but for FaceMesh we usually use the CDN within the worker
// because the package itself is quite large.

let faceMesh: any = null;

const initFaceMesh = async (cdnPath: string) => {
    // Use importScripts to load MediaPipe from CDN inside the worker context
    // This requires a classic worker (type: 'classic')
    // @ts-ignore
    importScripts(`${cdnPath}/face_mesh.js`);

    // @ts-ignore
    faceMesh = new FaceMesh({
        locateFile: (file: string) => `${cdnPath}/${file}`
    });

    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
        enableFaceGeometry: false
    });

    faceMesh.onResults((results: any) => {
        if (results.multiFaceLandmarks) {
            // Send results back to main thread
            self.postMessage({
                type: 'RESULTS',
                landmarks: results.multiFaceLandmarks[0]
            });
        }
    });
};

self.onmessage = async (event: MessageEvent) => {
    const { type, data } = event.data;

    switch (type) {
        case 'INIT':
            await initFaceMesh(data.cdnPath);
            self.postMessage({ type: 'READY' });
            break;

        case 'PROCESS':
            if (faceMesh && data.image) {
                // data.image should be an ImageBitmap for max performance
                await faceMesh.send({ image: data.image });
                // Close the bitmap to free memory
                if (data.image.close) data.image.close();
            }
            break;
    }
};
