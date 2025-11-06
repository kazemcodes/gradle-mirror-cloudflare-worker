import htmlPage from '../public/index.html';
import robotsPage from '../public/robots.txt';

const repositories = {
    google: "https://dl.google.com/dl/android/maven2",
    central: "https://repo.maven.apache.org/maven2",
    jitpack: "https://jitpack.io",
    "gradle-plugin-portal": "https://plugins.gradle.org/m2",
    sonatype: "https://oss.sonatype.org/content/repositories/releases",
    "sonatype-snapshots": "https://oss.sonatype.org/content/repositories/snapshots",
    androidx: "https://androidx.dev/storage/compose-compiler/repository",
    jetbrains: "https://maven.pkg.jetbrains.space/public/p/compose/dev",
    clojars: "https://repo.clojars.org",
    jcenter: "https://jcenter.bintray.com",
    "spring-releases": "https://repo.spring.io/release",
    "spring-milestones": "https://repo.spring.io/milestone",
    "spring-snapshots": "https://repo.spring.io/snapshot",
    atlassian: "https://packages.atlassian.com/maven/public",
    redhat: "https://maven.repository.redhat.com/ga",
    fabric: "https://maven.fabric.io/public",
    firebase: "https://maven.google.com",
    huawei: "https://developer.huawei.com/repo",
    mapbox: "https://api.mapbox.com/downloads/v2/releases/maven",
    realm: "https://jitpack.io",
    "kotlin-eap": "https://maven.pkg.jetbrains.space/kotlin/p/kotlin/eap",
    "kotlin-dev": "https://maven.pkg.jetbrains.space/kotlin/p/kotlin/dev",
    kotlinx: "https://maven.pkg.jetbrains.space/kotlin/p/kotlinx/maven",
    ktor: "https://maven.pkg.jetbrains.space/public/p/ktor/eap",
    square: "https://oss.sonatype.org/content/repositories/snapshots",
    snapchat: "https://storage.googleapis.com/snap-kit-build/maven",
    jfrog: "https://oss.jfrog.org/artifactory/oss-snapshot-local",
    "gradle-distributions": "https://services.gradle.org/distributions"
};
export default {
    async fetch(request) {
        const url = new URL(request.url);

        // Extract the first part of the path
        const pathSegments = url.pathname.split('/').filter(Boolean); // Filter removes empty segments
        const repoKey = pathSegments[0]; // First segment of the path

        if (pathSegments.length === 0) {
            return new Response(htmlPage, {
                headers: { "content-type": "text/html; charset=utf-8" },
            });
        }
        if (url.pathname === "/robots.txt") {
            return new Response(robotsPage, {
                    headers: {"Content-Type": "text/plain; charset=utf-8"}
                }
            );
        }

        // Check if the URL starts with a specific repository key
        if (repositories[repoKey]) {
            const response= await fetchFromRepository(repositories[repoKey], url.pathname.replace(`/${repoKey}`, ''), request);
            if(response.ok) return response
        }else{
            for (const repoUrl of Object.values(repositories)) {
                const response = await fetchFromRepository(repoUrl, url.pathname, request);
                if (response.ok) return response; // Return the response if successful
            }
        }

        return new Response("Dependency Not Found.", { status: 404 });
    },
};

async function fetchFromRepository(baseUrl, path, request) {
    const targetUrl = `${baseUrl}${path}`;

    if (!path || path === '/') return new Response("",{status: 404})
    return await fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
    });
}
