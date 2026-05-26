import { useState, useMemo, useEffect, useRef } from 'react';
import { Book, Search, Rocket, Layers, Brain, Database, Server, Code, HelpCircle, Clock, ChevronDown, ChevronRight, ArrowUp, Menu, X, Cpu, Shield, Zap, GitBranch, Terminal, Globe, BookOpen, List, Tag } from 'lucide-react';
import { gettingStarted, architecture, changelog } from '../data/docs-getting-started';
import { featuresData } from '../data/docs-features';
import { featuresAdvancedData } from '../data/docs-features-advanced';
import { glossary, faq, apiReference } from '../data/docs-reference';

// --- Sub-components ---

function MethodBadge({ method }) {
  const colors = {
    GET: 'bg-green-500/20 text-green-400 border-green-500/30',
    POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PATCH: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
    PUT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${colors[method] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
      {method}
    </span>
  );
}

function AuthBadge({ auth }) {
  return auth ? (
    <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
      <Shield className="w-3 h-3" /> Auth
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30">Public</span>
  );
}

function ExpandableCard({ title, overview, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-purple-500/20 rounded-xl bg-purple-900/10 backdrop-blur-sm overflow-hidden transition-all duration-200">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-purple-500/5 transition-colors">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm">{title}</h4>
          {!open && overview && <p className="text-gray-400 text-xs mt-1 truncate">{overview}</p>}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 border-t border-purple-500/10">{children}</div>}
    </div>
  );
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/25 transition-all" aria-label="Back to top">
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}


// --- Section IDs and nav config ---
const NAV_SECTIONS = [
  { id: 'getting-started', label: 'Getting Started', icon: 'Rocket' },
  { id: 'architecture', label: 'Architecture', icon: 'Layers' },
  { id: 'features-core', label: 'Features (Core)', icon: 'Brain' },
  { id: 'features-advanced', label: 'Features (Advanced)', icon: 'Zap' },
  { id: 'api-reference', label: 'API Reference', icon: 'Code' },
  { id: 'glossary', label: 'Glossary', icon: 'BookOpen' },
  { id: 'faq', label: 'FAQ', icon: 'HelpCircle' },
  { id: 'changelog', label: 'Changelog', icon: 'Clock' },
];

const ICON_MAP = { Rocket, Layers, Brain, Zap, Code, BookOpen, HelpCircle, Clock };

// --- Main Component ---
export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('getting-started');
  const mainRef = useRef(null);

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileNavOpen(false);
    }
  };

  // Search filtering
  const filteredGlossary = useMemo(() => {
    if (!searchQuery) return glossary;
    const q = searchQuery.toLowerCase();
    return glossary.filter(g => g.term.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredFaq = useMemo(() => {
    if (!searchQuery) return faq;
    const q = searchQuery.toLowerCase();
    return faq.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredFeatures = useMemo(() => {
    if (!searchQuery) return featuresData;
    const q = searchQuery.toLowerCase();
    return featuresData.filter(f => f.name.toLowerCase().includes(q) || f.overview.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredAdvanced = useMemo(() => {
    if (!searchQuery) return featuresAdvancedData;
    const q = searchQuery.toLowerCase();
    return featuresAdvancedData.filter(f => f.name.toLowerCase().includes(q) || f.overview.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredApi = useMemo(() => {
    if (!searchQuery) return apiReference;
    const q = searchQuery.toLowerCase();
    return apiReference.map(cat => ({
      ...cat,
      endpoints: cat.endpoints.filter(e => e.path.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.method.toLowerCase().includes(q))
    })).filter(cat => cat.endpoints.length > 0);
  }, [searchQuery]);

  const filteredChangelog = useMemo(() => {
    if (!searchQuery) return changelog;
    const q = searchQuery.toLowerCase();
    return changelog.filter(c => c.title.toLowerCase().includes(q) || c.version.toLowerCase().includes(q) || c.changes.some(ch => ch.toLowerCase().includes(q)));
  }, [searchQuery]);


  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      {/* Mobile nav toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="p-2 rounded-lg bg-purple-900/80 border border-purple-500/30 text-white backdrop-blur-sm" aria-label="Toggle navigation">
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0d0d24]/95 backdrop-blur-md border-r border-purple-500/20 z-40 overflow-y-auto transition-transform duration-300 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Book className="w-6 h-6 text-cyan-400" />
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Documentation</h1>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-purple-900/30 border border-purple-500/20 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>

            {/* Nav links */}
            <nav className="space-y-1">
              {NAV_SECTIONS.map(({ id, label, icon }) => {
                const Icon = ICON_MAP[icon];
                return (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === id ? 'bg-purple-500/20 text-cyan-400 border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-purple-500/10'}`}
                  >
                    {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main ref={mainRef} className="flex-1 lg:ml-0 min-w-0">
          <div className="max-w-4xl mx-auto px-6 py-12 lg:py-16">

            {/* Page title */}
            <div className="mb-12 text-center lg:text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">Platform Documentation</h1>
              <p className="text-gray-400 text-lg">Everything you need to build, train, and deploy ML models at scale.</p>
            </div>

            {/* Getting Started */}
            <section id="getting-started" className="mb-16 scroll-mt-20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Rocket className="w-6 h-6 text-cyan-400" /> Getting Started
              </h2>

              {/* System Requirements */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">{gettingStarted.systemRequirements.title}</h3>
                <div className="overflow-x-auto rounded-xl border border-purple-500/20">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-purple-900/30">
                        <th className="text-left px-4 py-3 text-purple-300 font-medium">Requirement</th>
                        <th className="text-left px-4 py-3 text-purple-300 font-medium">Specification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gettingStarted.systemRequirements.content.map((req, i) => (
                        <tr key={i} className="border-t border-purple-500/10 hover:bg-purple-500/5">
                          <td className="px-4 py-3 text-cyan-300 font-medium">{req.label}</td>
                          <td className="px-4 py-3 text-gray-300">{req.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Installation */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">{gettingStarted.installation.title}</h3>
                <ol className="space-y-3">
                  {gettingStarted.installation.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 p-3 rounded-lg bg-purple-900/10 border border-purple-500/10">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div>
                        <p className="text-white font-medium text-sm">{step.title}</p>
                        <p className="text-gray-400 text-xs mt-1">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Docker Setup */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">{gettingStarted.dockerSetup.title}</h3>
                <ol className="space-y-3">
                  {gettingStarted.dockerSetup.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 p-3 rounded-lg bg-purple-900/10 border border-purple-500/10">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div>
                        <p className="text-white font-medium text-sm">{step.title}</p>
                        <p className="text-gray-400 text-xs mt-1">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Quick Start */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">{gettingStarted.quickStart.title}</h3>
                <ol className="space-y-3">
                  {gettingStarted.quickStart.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 p-3 rounded-lg bg-purple-900/10 border border-purple-500/10">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div>
                        <p className="text-white font-medium text-sm">{step.title}</p>
                        <p className="text-gray-400 text-xs mt-1">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* Architecture */}
            <section id="architecture" className="mb-16 scroll-mt-20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Layers className="w-6 h-6 text-cyan-400" /> Architecture
              </h2>

              {/* Tech Stack */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">{architecture.techStack.title}</h3>
                <div className="space-y-3">
                  {architecture.techStack.layers.map((layer, i) => (
                    <div key={i} className="p-4 rounded-xl bg-purple-900/10 border border-purple-500/20 backdrop-blur-sm">
                      <h4 className="text-cyan-400 font-semibold text-sm mb-2 flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> {layer.name}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {layer.technologies.map((tech, j) => (
                          <span key={j} className="px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-xs text-gray-300">{tech}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distributed Training */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">{architecture.distributedTraining.title}</h3>
                <div className="space-y-4">
                  {architecture.distributedTraining.sections.map((sec, i) => (
                    <div key={i} className="p-4 rounded-xl bg-purple-900/10 border border-purple-500/10">
                      <h4 className="text-white font-medium text-sm mb-1">{sec.subtitle}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{sec.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auth Flow */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">{architecture.authFlow.title}</h3>
                <ol className="space-y-2">
                  {architecture.authFlow.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 p-3 rounded-lg bg-purple-900/10 border border-purple-500/10">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <p className="text-gray-300 text-sm">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Realtime Events */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">{architecture.realtime.title}</h3>
                <div className="overflow-x-auto rounded-xl border border-purple-500/20">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-purple-900/30">
                        <th className="text-left px-4 py-3 text-purple-300 font-medium">Event</th>
                        <th className="text-left px-4 py-3 text-purple-300 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {architecture.realtime.events.map((evt, i) => (
                        <tr key={i} className="border-t border-purple-500/10 hover:bg-purple-500/5">
                          <td className="px-4 py-3 text-cyan-300 font-mono text-xs">{evt.event}</td>
                          <td className="px-4 py-3 text-gray-300">{evt.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Features Core */}
            <section id="features-core" className="mb-16 scroll-mt-20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Brain className="w-6 h-6 text-cyan-400" /> Features (Core)
              </h2>
              <div className="space-y-3">
                {filteredFeatures.map((feature) => (
                  <ExpandableCard key={feature.id} title={`${feature.name} — ${feature.category}`} overview={feature.overview}>
                    <p className="text-gray-300 text-sm mt-3 mb-4">{feature.overview}</p>
                    {feature.steps && feature.steps.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">Steps</h5>
                        <ol className="space-y-2">
                          {feature.steps.map((step, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">{i + 1}</span>
                              <div><span className="text-white font-medium">{step.title}:</span> <span className="text-gray-400">{step.description}</span></div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {feature.tips && feature.tips.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-xs font-semibold text-green-300 uppercase tracking-wider mb-2">Tips</h5>
                        <ul className="space-y-1">
                          {feature.tips.map((tip, i) => (
                            <li key={i} className="text-sm text-gray-400 flex gap-2"><Zap className="w-3 h-3 text-green-400 flex-shrink-0 mt-1" /><span>{tip}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feature.troubleshooting && feature.troubleshooting.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-red-300 uppercase tracking-wider mb-2">Troubleshooting</h5>
                        <div className="space-y-2">
                          {feature.troubleshooting.map((t, i) => (
                            <div key={i} className="p-2 rounded-lg bg-red-900/10 border border-red-500/10 text-sm">
                              <p className="text-red-300 font-medium">{t.problem}</p>
                              <p className="text-gray-400 mt-1">{t.solution}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </ExpandableCard>
                ))}
              </div>
            </section>

            {/* Features Advanced */}
            <section id="features-advanced" className="mb-16 scroll-mt-20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Zap className="w-6 h-6 text-cyan-400" /> Features (Advanced)
              </h2>
              <div className="space-y-3">
                {filteredAdvanced.map((feature) => (
                  <ExpandableCard key={feature.id} title={`${feature.name} — ${feature.category}`} overview={feature.overview}>
                    <p className="text-gray-300 text-sm mt-3 mb-4">{feature.overview}</p>
                    {feature.steps && feature.steps.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">Steps</h5>
                        <ol className="space-y-2">
                          {feature.steps.map((step, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">{i + 1}</span>
                              <div><span className="text-white font-medium">{step.title}:</span> <span className="text-gray-400">{step.description}</span></div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {feature.tips && feature.tips.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-xs font-semibold text-green-300 uppercase tracking-wider mb-2">Tips</h5>
                        <ul className="space-y-1">
                          {feature.tips.map((tip, i) => (
                            <li key={i} className="text-sm text-gray-400 flex gap-2"><Zap className="w-3 h-3 text-green-400 flex-shrink-0 mt-1" /><span>{tip}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feature.troubleshooting && feature.troubleshooting.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-red-300 uppercase tracking-wider mb-2">Troubleshooting</h5>
                        <div className="space-y-2">
                          {feature.troubleshooting.map((t, i) => (
                            <div key={i} className="p-2 rounded-lg bg-red-900/10 border border-red-500/10 text-sm">
                              <p className="text-red-300 font-medium">{t.problem}</p>
                              <p className="text-gray-400 mt-1">{t.solution}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </ExpandableCard>
                ))}
              </div>
            </section>

            {/* API Reference */}
            <section id="api-reference" className="mb-16 scroll-mt-20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Code className="w-6 h-6 text-cyan-400" /> API Reference
              </h2>
              <div className="space-y-6">
                {filteredApi.map((cat, ci) => (
                  <div key={ci}>
                    <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                      <Terminal className="w-4 h-4" /> {cat.category}
                    </h3>
                    <div className="space-y-2">
                      {cat.endpoints.map((ep, ei) => (
                        <div key={ei} className="p-3 rounded-xl bg-purple-900/10 border border-purple-500/10 hover:border-purple-500/30 transition-colors">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <MethodBadge method={ep.method} />
                            <code className="text-sm text-white font-mono">{ep.path}</code>
                            <AuthBadge auth={ep.auth} />
                          </div>
                          <p className="text-gray-400 text-sm">{ep.description}</p>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs">
                            {ep.body && <span className="text-gray-500"><span className="text-purple-400">Body:</span> {ep.body}</span>}
                            {ep.response && <span className="text-gray-500"><span className="text-cyan-400">Response:</span> {ep.response}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Glossary */}
            <section id="glossary" className="mb-16 scroll-mt-20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-cyan-400" /> Glossary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredGlossary.sort((a, b) => a.term.localeCompare(b.term)).map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-purple-900/10 border border-purple-500/10 hover:border-purple-500/30 transition-colors">
                    <h4 className="text-cyan-300 font-semibold text-sm">{item.term}</h4>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">{item.definition}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="mb-16 scroll-mt-20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-cyan-400" /> FAQ
              </h2>
              <div className="space-y-2">
                {filteredFaq.map((item, i) => (
                  <FaqItem key={i} question={item.question} answer={item.answer} />
                ))}
              </div>
            </section>

            {/* Changelog */}
            <section id="changelog" className="mb-16 scroll-mt-20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Clock className="w-6 h-6 text-cyan-400" /> Changelog
              </h2>
              <div className="relative border-l-2 border-purple-500/30 ml-3 space-y-6">
                {filteredChangelog.map((release, i) => (
                  <div key={i} className="pl-6 relative">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-purple-500/30 border-2 border-cyan-400"></div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 text-xs font-mono font-bold border border-cyan-500/30">v{release.version}</span>
                      <span className="text-gray-500 text-xs">{release.date}</span>
                    </div>
                    <h3 className="text-white font-semibold text-sm mb-2">{release.title}</h3>
                    <ul className="space-y-1">
                      {release.changes.map((change, j) => (
                        <li key={j} className="text-gray-400 text-xs flex gap-2">
                          <span className="text-purple-400 flex-shrink-0">•</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </main>
      </div>

      <BackToTop />
    </div>
  );
}


// FAQ Accordion Item
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-purple-500/20 rounded-xl overflow-hidden bg-purple-900/10">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-purple-500/5 transition-colors">
        <span className="text-white text-sm font-medium pr-4">{question}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-purple-500/10">
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
