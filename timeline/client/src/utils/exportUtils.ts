
import type { GraphNode, GraphLink } from './graphMetrics';

export function exportToGEXF(nodes: GraphNode[], links: GraphLink[]): string {
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">
    <meta lastmodifieddate="${new Date().toISOString().split('T')[0]}">
        <creator>Capture Cascade Timeline</creator>
        <description>Exported Network Graph</description>
    </meta>
    <graph mode="static" defaultedgetype="undirected">
        <nodes>`;

    const nodesXml = nodes.map(n =>
        `            <node id="${n.id}" label="${n.label.replace(/&/g, '&amp;')}">
                <attvalues>
                    <attvalue for="type" value="${n.group}"/>
                    <attvalue for="date" value="${n.date}"/>
                </attvalues>
            </node>`
    ).join('\n');

    const edgesXml = links.map((l, i) =>
        `            <edge id="${i}" source="${l.source as string}" target="${l.target as string}" weight="${l.strength || 1}" />`
    ).join('\n');

    const footer = `        </nodes>
        <edges>
${edgesXml}
        </edges>
    </graph>
</gexf>`;

    return header + '\n' + nodesXml + '\n' + footer;
}

export function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
