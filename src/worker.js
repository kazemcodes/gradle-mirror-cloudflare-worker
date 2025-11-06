import htmlPage from '../public/index.html';
import robotsPage from '../public/robots.txt';

// Comprehensive Maven/Gradle repository list
const repositories = {
    // Primary repositories (checked first for better performance)
    google: "https://dl.google.com/dl/android/maven2",
    central: "https://repo.maven.apache.org/maven2",
    jitpack: "https://jitpack.io",
    
    // Gradle
    "gradle-plugin-portal": "https://plugins.gradle.org/m2",
    "gradle-distributions": "https://services.gradle.org/distributions",
    
    // Sonatype (primary and alternative s01 instance)
    sonatype: "https://oss.sonatype.org/content/repositories/releases",
    "sonatype-snapshots": "https://oss.sonatype.org/content/repositories/snapshots",
    "sonatype-staging": "https://oss.sonatype.org/content/repositories/staging",
    "sonatype-s01": "https://s01.oss.sonatype.org/content/repositories/releases",
    "sonatype-s01-snapshots": "https://s01.oss.sonatype.org/content/repositories/snapshots",
    "sonatype-s01-staging": "https://s01.oss.sonatype.org/content/repositories/staging",
    
    // Android & Compose
    androidx: "https://androidx.dev/storage/compose-compiler/repository",
    "android-tools": "https://dl.google.com/android/repository",
    
    // JetBrains ecosystem
    jetbrains: "https://maven.pkg.jetbrains.space/public/p/compose/dev",
    "jetbrains-intellij": "https://www.jetbrains.com/intellij-repository/releases",
    "jetbrains-intellij-snapshots": "https://www.jetbrains.com/intellij-repository/snapshots",
    "kotlin-eap": "https://maven.pkg.jetbrains.space/kotlin/p/kotlin/eap",
    "kotlin-dev": "https://maven.pkg.jetbrains.space/kotlin/p/kotlin/dev",
    "kotlin-bootstrap": "https://maven.pkg.jetbrains.space/kotlin/p/kotlin/bootstrap",
    kotlinx: "https://maven.pkg.jetbrains.space/kotlin/p/kotlinx/maven",
    ktor: "https://maven.pkg.jetbrains.space/public/p/ktor/eap",
    
    // Spring
    "spring-releases": "https://repo.spring.io/release",
    "spring-milestones": "https://repo.spring.io/milestone",
    "spring-snapshots": "https://repo.spring.io/snapshot",
    "spring-plugins": "https://repo.spring.io/plugins-release",
    
    // Other languages
    clojars: "https://repo.clojars.org",
    
    // Legacy (deprecated but still used)
    jcenter: "https://jcenter.bintray.com",
    
    // Company-specific
    atlassian: "https://packages.atlassian.com/maven/public",
    redhat: "https://maven.repository.redhat.com/ga",
    fabric: "https://maven.fabric.io/public",
    firebase: "https://maven.google.com",
    huawei: "https://developer.huawei.com/repo",
    mapbox: "https://api.mapbox.com/downloads/v2/releases/maven",
    snapchat: "https://storage.googleapis.com/snap-kit-build/maven",
    square: "https://oss.sonatype.org/content/repositories/snapshots",
    
    // Additional repositories
    jfrog: "https://oss.jfrog.org/artifactory/oss-snapshot-local",
    "jfrog-libs": "https://oss.jfrog.org/artifactory/libs-release",
    oracle: "https://maven.oracle.com",
    "eclipse-releases": "https://repo.eclipse.org/content/repositories/releases",
    "eclipse-snapshots": "https://repo.eclipse.org/content/repositories/snapshots",
    "apache-snapshots": "https://repository.apache.org/content/repositories/snapshots",
    "apache-releases": "https://repository.apache.org/content/repositories/releases",
    "jboss-public": "https://repository.jboss.org/nexus/content/groups/public",
    "jboss-releases": "https://repository.jboss.org/nexus/content/repositories/releases",
    "vaadin-addons": "https://maven.vaadin.com/vaadin-addons",
    "vaadin-prereleases": "https://maven.vaadin.com/vaadin-prereleases",
    "typesafe-releases": "https://repo.typesafe.com/typesafe/releases",
    "typesafe-ivy": "https://repo.typesafe.com/typesafe/ivy-releases",
    "sbt-plugins": "https://repo.scala-sbt.org/scalasbt/sbt-plugin-releases",
    "hortonworks": "https://repo.hortonworks.com/content/repositories/releases",
    "cloudera": "https://repository.cloudera.com/artifactory/cloudera-repos",
    "confluent": "https://packages.confluent.io/maven",
    "jitsi": "https://github.com/jitsi/jitsi-maven-repository/raw/master/releases",
    "oss-china": "https://maven.aliyun.com/repository/public",
    
    // Additional repositories from community lists
    "maven-central-mirror": "https://repo1.maven.org/maven2",
    "gradle-releases": "https://repo.gradle.org/gradle/libs-releases-local",
    "kotlin-compiler": "https://maven.pkg.jetbrains.space/kotlin/p/kotlin/compiler"
};
// Cache configuration
const CACHE_TTL = {
    success: 86400,      // 24 hours for successful responses
    notFound: 3600,      // 1 hour for 404s
    error: 300           // 5 minutes for errors
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        const repoKey = pathSegments[0];

        // Serve homepage
        if (pathSegments.length === 0) {
            return new Response(htmlPage, {
                headers: { 
                    "content-type": "text/html; charset=utf-8",
                    "cache-control": "public, max-age=3600"
                },
            });
        }

        // Serve robots.txt
        if (url.pathname === "/robots.txt") {
            return new Response(robotsPage, {
                headers: { 
                    "content-type": "text/plain; charset=utf-8",
                    "cache-control": "public, max-age=86400"
                }
            });
        }

        // Try to get from cache first
        const cache = caches.default;
        let response = await cache.match(request);
        if (response) {
            return response;
        }

        // Check if URL starts with a specific repository key
        if (repositories[repoKey]) {
            const repoPath = url.pathname.replace(`/${repoKey}`, '');
            response = await fetchFromRepository(repositories[repoKey], repoPath, request);
            
            if (response.ok) {
                response = addCacheHeaders(response, CACHE_TTL.success);
                ctx.waitUntil(cache.put(request, response.clone()));
                return response;
            }
        }

        // Fallback: try all repositories
        for (const [name, repoUrl] of Object.entries(repositories)) {
            response = await fetchFromRepository(repoUrl, url.pathname, request);
            
            if (response.ok) {
                response = addCacheHeaders(response, CACHE_TTL.success);
                ctx.waitUntil(cache.put(request, response.clone()));
                return response;
            }
        }

        // Return 404 with cache
        response = new Response("Dependency not found in any repository.", { 
            status: 404,
            headers: {
                "content-type": "text/plain; charset=utf-8",
                "cache-control": `public, max-age=${CACHE_TTL.notFound}`
            }
        });
        
        ctx.waitUntil(cache.put(request, response.clone()));
        return response;
    },
};

async function fetchFromRepository(baseUrl, path, request) {
    if (!path || path === '/') {
        return new Response("", { status: 404 });
    }

    const targetUrl = `${baseUrl}${path}`;

    try {
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: request.headers,
            body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
            cf: {
                cacheTtl: CACHE_TTL.success,
                cacheEverything: true
            }
        });

        return response;
    } catch (error) {
        return new Response("", { status: 500 });
    }
}

function addCacheHeaders(response, ttl) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set("cache-control", `public, max-age=${ttl}`);
    newHeaders.set("x-proxy-cache", "HIT");
    
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
}
