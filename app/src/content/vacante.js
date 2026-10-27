// Léxico del lector de ofertas: cómo suelen escribir las ofertas cada competencia, tecnologías y
// certificaciones de las 13 rutas, y marcas de la presentación «Háblame de ti». Redacción propia.
// Un término que acaba en * es una raíz: «proactiv*» encuentra proactivo, proactiva y proactividad.
// La búsqueda no distingue mayúsculas ni tildes.

export const VAC_COMPETENCIAS = {
  iniciativa: [
    'proactiv*', 'iniciativa', 'autonom*', 'sin supervision', 'autogestion', 'capacidad de decision', 'ownership',
    'self-starter', 'self starter', 'initiative', 'take ownership', 'autonomous*', 'independently', 'proactive*',
  ],
  cliente: [
    'orientacion al cliente', 'atencion al cliente', 'servicio al cliente', 'trato con clientes', 'trato con el cliente', 'con el cliente', 'con clientes', 'usuario final',
    'stakeholders', 'customer*', 'client-facing', 'client facing', 'clients', 'end users', 'end-users', 'user needs',
  ],
  aprendizaje: [
    'ganas de aprender', 'aprendizaje continuo', 'capacidad de aprendizaje', 'curiosidad', 'curios*', 'autodidact*',
    'formacion continua', 'en constante aprendizaje', 'willingness to learn', 'eager to learn', 'curious', 'curiosity',
    'continuous learning', 'growth mindset', 'learn quickly', 'fast learner', 'quick learner',
  ],
  analisis: [
    'analitic*', 'capacidad de analisis', 'atencion al detalle', 'detallista', 'pensamiento critico', 'rigor', 'riguros*',
    'analytical', 'analysis', 'attention to detail', 'detail-oriented', 'detail oriented', 'critical thinking', 'data-driven',
    'data driven',
  ],
  problemas: [
    'resolucion de problemas', 'resolver problemas', 'resolutiv*', 'troubleshooting', 'resolucion de incidencias',
    'problem solving', 'problem-solving', 'solve problems', 'solution-oriented', 'solution oriented', 'root cause',
  ],
  comunicacion: [
    'comunicacion', 'comunicativ*', 'habilidades comunicativas', 'oratoria', 'presentaciones', 'capacidad de explicar',
    'redaccion', 'communication', 'communicate', 'communicator', 'presentation skills', 'written and verbal',
    'verbal and written', 'storytelling',
  ],
  equipo: [
    'trabajo en equipo', 'trabajar en equipo', 'equipos multidisciplinares', 'equipo multidisciplinar', 'colaborativ*', 'colaboracion', 'colaborar',
    'team player', 'teamwork', 'collaborat*', 'cross-functional', 'cross functional', 'work in a team',
  ],
  liderazgo: [
    'liderazgo', 'liderar', 'lider', 'mentoria', 'mentoriz*', 'gestion de equipos', 'coordinar equipos', 'capacidad de influencia',
    'leadership', 'lead a team', 'leading teams', 'mentor*', 'coach*', 'influence', 'people management',
  ],
  conflictos: [
    'gestion de conflictos', 'conflictos', 'negociacion', 'negociar', 'mediacion', 'mano izquierda',
    'conflict resolution', 'conflict management', 'negotiat*', 'difficult conversations',
  ],
  presion: [
    'bajo presion', 'trabajo bajo presion', 'entornos dinamicos', 'entorno dinamico', 'ritmo rapido', 'alta exigencia',
    'plazos ajustados', 'guardias', 'turnos', '24x7', '24/7', 'multitarea', 'under pressure', 'fast-paced', 'fast paced',
    'tight deadlines', 'on-call', 'on call', 'multitask*', 'shifts',
  ],
  etica: [
    'confidencialidad', 'discrecion', 'integridad', 'etica profesional', 'etica', 'honest*', 'responsabilidad con los datos',
    'confidential*', 'integrity', 'ethic*', 'discretion', 'trustworth*',
  ],
  resultados: [
    'orientacion a resultados', 'orientado a resultados', 'orientada a resultados', 'orientacion a objetivos',
    'cumplimiento de objetivos', 'consecucion de objetivos', 'kpi*', 'metricas', 'results-oriented', 'results oriented', 'results-driven',
    'results driven', 'deliver results', 'goal-oriented', 'targets', 'metrics',
  ],
};

/** Tecnologías, marcos y certificaciones: [etiqueta, ...variantes]. */
export const VAC_TECNOLOGIAS = [
  // Seguridad ofensiva y defensiva
  ['Pentesting', 'pentest*', 'pruebas de penetracion', 'penetration testing', 'hacking etico', 'ethical hacking'],
  ['Red Team', 'red team*'], ['Blue Team', 'blue team*'], ['SOC', 'soc'], ['SIEM', 'siem'], ['Splunk', 'splunk'],
  ['QRadar', 'qradar'], ['Microsoft Sentinel', 'sentinel'], ['Elastic', 'elastic', 'elk', 'elasticsearch'], ['Wazuh', 'wazuh'],
  ['EDR', 'edr', 'xdr'], ['CrowdStrike', 'crowdstrike'], ['Microsoft Defender', 'defender'], ['Threat hunting', 'threat hunting'],
  ['Respuesta a incidentes', 'respuesta a incidentes', 'incident response', 'dfir'], ['Análisis forense', 'forense', 'forensics'],
  ['Malware', 'malware'], ['Burp Suite', 'burp'], ['Nmap', 'nmap'], ['Metasploit', 'metasploit'], ['Wireshark', 'wireshark'],
  ['Kali Linux', 'kali'], ['OWASP', 'owasp'], ['MITRE ATT&CK', 'mitre', 'att&ck'], ['Active Directory', 'active directory', 'directorio activo'],
  ['Firewalls', 'firewall*', 'cortafuegos'], ['IDS/IPS', 'ids', 'ips', 'snort', 'suricata'], ['Gestión de vulnerabilidades', 'gestion de vulnerabilidades', 'vulnerability management'],
  ['IAM', 'iam', 'gestion de identidades', 'identity and access'], ['PKI', 'pki'], ['Criptografía', 'criptografia', 'cryptography'],
  // Cumplimiento
  ['ISO 27001', 'iso 27001', 'iso/iec 27001', '27001'], ['ENS', 'esquema nacional de seguridad', 'ens'], ['NIS2', 'nis2', 'nis 2'],
  ['DORA', 'dora'], ['RGPD', 'rgpd', 'gdpr', 'lopdgdd'], ['PCI DSS', 'pci dss', 'pci-dss', 'pci'], ['NIST', 'nist'],
  ['SOC 2', 'soc 2', 'soc2'], ['ISO 22301', 'iso 22301', '22301'], ['ITIL', 'itil'], ['COBIT', 'cobit'],
  ['Análisis de riesgos', 'analisis de riesgos', 'gestion de riesgos', 'risk assessment', 'risk management'],
  ['Auditoría', 'auditoria*', 'audit*'], ['Continuidad de negocio', 'continuidad de negocio', 'business continuity', 'bia'],
  // Sistemas y cloud
  ['Linux', 'linux'], ['Windows Server', 'windows server'], ['AWS', 'aws', 'amazon web services'], ['Azure', 'azure'],
  ['Google Cloud', 'gcp', 'google cloud'], ['Kubernetes', 'kubernetes', 'k8s'], ['Docker', 'docker', 'contenedores', 'containers'],
  ['Terraform', 'terraform'], ['Ansible', 'ansible'], ['VMware', 'vmware'], ['CI/CD', 'ci/cd', 'integracion continua', 'continuous integration'],
  ['Jenkins', 'jenkins'], ['GitLab', 'gitlab'], ['GitHub Actions', 'github actions'], ['Redes', 'redes', 'networking', 'tcp/ip'],
  ['DNS', 'dns'], ['Bash', 'bash', 'shell scripting'], ['PowerShell', 'powershell'], ['Monitorización', 'monitorizacion', 'monitoring', 'observabilidad', 'observability'],
  // Desarrollo
  ['Python', 'python'], ['Java', 'java'], ['JavaScript', 'javascript'], ['TypeScript', 'typescript'], ['React', 'react'],
  ['Angular', 'angular'], ['Node.js', 'node.js', 'nodejs'], ['C#', 'c#'], ['.NET', '.net'], ['Go', 'golang'], ['PHP', 'php'],
  ['SQL', 'sql'], ['PostgreSQL', 'postgresql', 'postgres'], ['MySQL', 'mysql'], ['MongoDB', 'mongodb'], ['APIs REST', 'api rest', 'rest api', 'apis', 'api'],
  ['Git', 'git'], ['Microservicios', 'microservicios', 'microservices'], ['Pruebas automatizadas', 'testing', 'tests unitarios', 'unit testing', 'tdd'],
  ['DevSecOps', 'devsecops'], ['SAST/DAST', 'sast', 'dast'],
  // Datos e IA
  ['Excel', 'excel'], ['Power BI', 'power bi', 'powerbi'], ['Tableau', 'tableau'], ['Spark', 'spark', 'pyspark'], ['Databricks', 'databricks'],
  ['pandas', 'pandas'], ['ETL', 'etl'], ['Estadística', 'estadistica', 'statistics'], ['Machine learning', 'machine learning', 'aprendizaje automatico'],
  ['Deep learning', 'deep learning'], ['LLM', 'llm*', 'modelos de lenguaje', 'ia generativa', 'generative ai'], ['PyTorch', 'pytorch'],
  ['TensorFlow', 'tensorflow'], ['MLOps', 'mlops'], ['RAG', 'rag'],
  // Producto, diseño y negocio
  ['Scrum', 'scrum'], ['Kanban', 'kanban'], ['Agile', 'agile', 'agil', 'metodologias agiles'], ['Jira', 'jira'], ['Confluence', 'confluence'],
  ['Figma', 'figma'], ['Investigación de usuarios', 'investigacion de usuarios', 'user research', 'ux research'], ['Prototipado', 'prototipado', 'prototyping'],
  ['Accesibilidad', 'accesibilidad', 'accessibility', 'wcag'], ['CRM', 'crm'], ['Salesforce', 'salesforce'], ['RFP', 'rfp', 'rfi', 'licitaciones', 'tenders'],
  ['ServiceNow', 'servicenow'], ['Microsoft 365', 'office 365', 'microsoft 365', 'm365'], ['Helpdesk', 'helpdesk', 'help desk', 'service desk', 'cau'],
  // Certificaciones
  ['OSCP', 'oscp'], ['eJPT', 'ejpt'], ['CEH', 'ceh'], ['CISSP', 'cissp'], ['CISM', 'cism'], ['CISA', 'cisa'],
  ['CompTIA Security+', 'security+', 'security plus'], ['CCNA', 'ccna'], ['PMP', 'pmp'], ['ISO 27001 Lead Auditor', 'lead auditor'],
];

/** Modalidad de trabajo. */
export const VAC_MODALIDAD = {
  remoto: ['remoto', 'teletrabajo', '100% remoto', 'remote', 'fully remote', 'work from home'],
  hibrido: ['hibrido', 'hibrida', 'hybrid'],
  presencial: ['presencial', 'on-site', 'onsite', 'in-office', 'in office'],
};

/** Idiomas que suelen pedir las ofertas. */
export const VAC_IDIOMAS = {
  ingles: ['ingles', 'english'],
  frances: ['frances', 'french'],
  aleman: ['aleman', 'german'],
  portugues: ['portugues', 'portuguese'],
};

/** Palabras que preceden a un conector y no aportan a una viñeta de CV. */
export const CV_CONECTORES = [
  'después', 'despues', 'luego', 'entonces', 'primero', 'también', 'tambien', 'además', 'ademas', 'por último', 'por ultimo',
  'finalmente', 'al final', 'por eso', 'así que', 'asi que', 'y', 'then', 'first', 'also', 'finally', 'after that', 'next',
  'so', 'and', 'in the end',
];

/** Marcas de las tres partes de la presentación «Háblame de ti». */
export const PRESENTACION_MARCAS = {
  es: {
    presente: ['actualmente', 'ahora', 'hoy', 'en este momento', 'trabajo como', 'trabajo en', 'soy', 'estoy terminando', 'estoy estudiando', 'me dedico'],
    pasado: ['antes', 'empecé', 'vengo de', 'durante', 'he trabajado', 'trabajé', 'estudié', 'llevo', 'hace', 'años', 'hice', 'aprendí', 'pasé'],
    futuro: ['busco', 'quiero', 'me gustaría', 'me interesa', 'por eso', 'mi objetivo', 'aportar', 'me encaja', 'me atrae', 'puedo aportar'],
    puesto: ['este puesto', 'este rol', 'esta posición', 'vuestro equipo', 'vuestra empresa', 'el puesto', 'la oferta', 'vuestro', 'vuestra', 'con vosotros'],
  },
  en: {
    presente: ['currently', 'right now', 'today', 'i work as', 'i work at', "i'm a", 'i am a', "i'm finishing", 'i am studying', "i'm studying"],
    pasado: ['before', 'i started', 'i spent', 'for the last', 'i have worked', "i've worked", 'i worked', 'i studied', 'years', 'previously', 'i learned', 'i learnt'],
    futuro: ["i'm looking", 'i am looking', 'i want', "i'd like", 'i would like', "that's why", 'my goal', 'bring', 'contribute', 'excites me', 'attracts me'],
    puesto: ['this role', 'this position', 'your team', 'your company', 'the role', 'the job', 'with you'],
  },
};
