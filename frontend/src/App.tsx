import { useState, useEffect } from 'react';

interface Experience {
    id: string;
    company: string;
    role: string;
    duration: string;
    description: string;
}

interface Project {
    id: string;
    name: string;
    tech: string;
    details: string;
}

interface Story {
    id: string;
    title: string;
    story: string;
}

interface Template {
    id: string;
    name: string;
    preview: string | null;
}

interface ProfileData {
    personal_info: {
        name: string;
        email: string;
        phone: string;
        linkedin: string;
        github: string;
    };
    skills: string[];
    experience: Experience[];
    projects: Project[];
    achievements_story: Story[];
}

function App() {
    const [activeTab, setActiveTab] = useState('generate');
    const [profileData, setProfileData] = useState<ProfileData>({
        personal_info: { name: '', email: '', phone: '', linkedin: '', github: '' },
        skills: [],
        experience: [],
        projects: [],
        achievements_story: []
    });
    const [jobDescription, setJobDescription] = useState('');
    const [aiInstructions, setAiInstructions] = useState('');
    const [customName, setCustomName] = useState('');
    const [githubUsername, setGithubUsername] = useState('Dexterisham');
    const [generationStatus, setGenerationStatus] = useState<'idle' | 'loading' | 'success' | 'partial_success' | 'error'>('idle');
    const [generatedFile, setGeneratedFile] = useState('');
    const [generatedTex, setGeneratedTex] = useState('');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
    const [logs, setLogs] = useState<string[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [backendStatus, setBackendStatus] = useState<'checking' | 'awake' | 'sleeping' | 'error'>('checking');

    const API_URL = (import.meta.env.VITE_API_URL as string | undefined)
        || (import.meta.env.DEV ? 'http://localhost:8000' : '');

    useEffect(() => {
        fetchProfile();
        fetchTemplates();
        fetchHistory();
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            const res = await fetch(`${API_URL}/models`);
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.models)) {
                    setAvailableModels(data.models);
                    if (data.models.length > 0) {
                        // Keep default if it exists in list, otherwise take first
                        if (!data.models.includes(selectedModel)) {
                            setSelectedModel(data.models[0]);
                        }
                    }
                } else if (Array.isArray(data)) {
                    setAvailableModels(data);
                }
            }
        } catch (e) {
            console.error("Failed to fetch models", e);
        }
    };

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/profile`);
            if (res.ok) {
                const data = await res.json();
                // Ensure all fields exist
                setProfileData({
                    personal_info: data.personal_info || { name: '', email: '', phone: '', linkedin: '', github: '' },
                    skills: data.skills || [],
                    experience: data.experience || [],
                    projects: data.projects || [],
                    achievements_story: data.achievements_story || []
                });
            }
        } catch (e) {
            console.error("Failed to fetch profile", e);
            addLog("Error fetching profile. Is backend running?");
        }
    };

    const fetchTemplates = async () => {
        setBackendStatus('checking');
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s initial check

            const res = await fetch(`${API_URL}/templates`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && data.templates) {
                    setTemplates(data.templates);
                    if (data.templates.length > 0) setSelectedTemplate(data.templates[0].id);
                    setBackendStatus('awake');
                }
            } else {
                setBackendStatus('error');
            }
        } catch (e) {
            console.error("Failed to fetch templates", e);
            setBackendStatus('sleeping');
            
            // Auto-retry after 15 seconds if it was sleeping
            setTimeout(() => {
                fetchTemplates();
            }, 15000);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/history`);
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.history)) {
                    setHistory(data.history);
                } else if (Array.isArray(data)) {
                    setHistory(data);
                }
            }
        } catch (e) {
            console.error("Failed to fetch history");
        }
    };

    const handleSaveProfile = async () => {
        try {
            await fetch(`${API_URL}/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            alert('Profile saved!');
            addLog("Profile updated successfully.");
        } catch (e) {
            alert('Failed to save profile');
        }
    };

    const handlePersonalInfoChange = (field: keyof ProfileData['personal_info'], value: string) => {
        setProfileData(prev => ({ ...prev, personal_info: { ...prev.personal_info, [field]: value } }));
    };

    const handleSkillAdd = (skill: string) => {
        if (skill && !profileData.skills.includes(skill)) {
            setProfileData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
        }
    };

    const handleSkillRemove = (skill: string) => {
        setProfileData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
    };

    const handleExperienceChange = (id: string, field: keyof Experience, value: string) => {
        setProfileData(prev => ({
            ...prev,
            experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
        }));
    };

    const addExperience = () => {
        const newExp: Experience = { id: Date.now().toString(), company: '', role: '', duration: '', description: '' };
        setProfileData(prev => ({ ...prev, experience: [newExp, ...prev.experience] }));
    };

    const removeExperience = (id: string) => {
        setProfileData(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== id) }));
    };

    const handleProjectChange = (id: string, field: keyof Project, value: string) => {
        setProfileData(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
        }));
    };

    const addProject = () => {
        const newProj: Project = { id: Date.now().toString(), name: '', tech: '', details: '' };
        setProfileData(prev => ({ ...prev, projects: [newProj, ...prev.projects] }));
    };

    const removeProject = (id: string) => {
        setProfileData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
    };

    const handleStoryChange = (id: string, field: keyof Story, value: string) => {
        setProfileData(prev => ({
            ...prev,
            achievements_story: prev.achievements_story.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const addStory = () => {
        const newStory: Story = { id: Date.now().toString(), title: '', story: '' };
        setProfileData(prev => ({ ...prev, achievements_story: [newStory, ...prev.achievements_story] }));
    };

    const removeStory = (id: string) => {
        setProfileData(prev => ({ ...prev, achievements_story: prev.achievements_story.filter(s => s.id !== id) }));
    };

    const fetchGithubRepos = async () => {
        if (!githubUsername) return;
        try {
            addLog(`Fetching GitHub repos for ${githubUsername}...`);
            const res = await fetch(`https://api.github.com/users/${githubUsername}/repos`);
            if (res.ok) {
                const repos = await res.json();
                const newProjects: Project[] = repos.map((repo: any) => ({
                    id: String(repo.id),
                    name: repo.name,
                    tech: repo.language || 'Unknown',
                    details: repo.description || `Check out ${repo.name} on GitHub.`
                }));

                setProfileData(prev => ({
                    ...prev,
                    projects: [...prev.projects, ...newProjects].filter((project, index, list) => {
                        const idKey = project.id?.toLowerCase?.() || '';
                        const nameKey = project.name?.toLowerCase?.() || '';
                        return index === list.findIndex((candidate) => {
                            const candidateId = candidate.id?.toLowerCase?.() || '';
                            const candidateName = candidate.name?.toLowerCase?.() || '';
                            return (idKey && idKey === candidateId) || (nameKey && nameKey === candidateName);
                        });
                    })
                }));
                addLog(`✅ Fetched ${newProjects.length} repos from GitHub.`);
            } else {
                addLog(`❌ Failed to fetch repos: ${res.statusText}`);
                alert('Failed to fetch from GitHub. Check username or rate limit.');
            }
        } catch (e) {
            console.error(e);
            addLog("❌ Error fetching from GitHub.");
        }
    };

    const handleGenerate = async () => {
        setGenerationStatus('loading');
        setGeneratedFile('');
        setGeneratedTex('');
        addLog("Starting generation process...");
        addLog(`Job Description length: ${jobDescription.length} chars`);

        try {
            const res = await fetch(`${API_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_description: jobDescription,
                    template_name: selectedTemplate,
                    custom_name: customName,
                    instructions: aiInstructions,
                    model: selectedModel
                })
            });

            const data = await res.json();

            // Refresh history
            fetchHistory();

            if (data.status === 'success') {
                setGeneratedFile(data.filename);
                setGeneratedTex(data.tex_content);
                setGenerationStatus('success');
                addLog(`✅ Success! PDF generated: ${data.filename}`);
            } else if (data.status === 'partial_success') {
                setGeneratedTex(data.tex_content);
                setGenerationStatus('partial_success');
                addLog(`⚠️ PDF Failed, but LaTeX generated. Error: ${data.error}`);
            } else {
                setGenerationStatus('error');
                addLog(`❌ Error: ${data.detail}`);
            }
        } catch (e) {
            setGenerationStatus('error');
            addLog(`❌ Network Error: ${e}`);
        }
    };

    return (
        <div className="min-h-screen bg-neo-bg text-neo-text font-sans">
            <header className="bg-neo-yellow border-b-4 border-neo-border p-6 shadow-neo-brutal mb-8 relative z-10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-extrabold tracking-tight uppercase">AI Resume Builder</h1>
                        <p className="font-bold text-sm mt-1 bg-white inline-block px-2 border border-neo-border shadow-neo-focus">Tailor your CV with Gemini & LaTeX</p>
                    </div>
                    <div className="flex flex-wrap justify-center space-x-2 bg-white border-2 border-neo-border p-1 shadow-neo">
                        <button onClick={() => setActiveTab('generate')} className={`px-5 py-2 font-bold transition-all duration-200 border-2 ${activeTab === 'generate' ? 'bg-neo-pink border-neo-border shadow-neo translate-x-[2px] translate-y-[2px]' : 'bg-white border-transparent hover:bg-gray-100'}`}>Generate</button>
                        <button onClick={() => setActiveTab('history')} className={`px-5 py-2 font-bold transition-all duration-200 border-2 ${activeTab === 'history' ? 'bg-neo-pink border-neo-border shadow-neo translate-x-[2px] translate-y-[2px]' : 'bg-white border-transparent hover:bg-gray-100'}`}>History</button>
                        <button onClick={() => setActiveTab('profile')} className={`px-5 py-2 font-bold transition-all duration-200 border-2 ${activeTab === 'profile' ? 'bg-neo-pink border-neo-border shadow-neo translate-x-[2px] translate-y-[2px]' : 'bg-white border-transparent hover:bg-gray-100'}`}>Master Profile</button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 md:p-6 mb-12">
                {activeTab === 'profile' && (
                    <div className="neo-card p-6 md:p-8 animate-fade-in space-y-10 relative">
                        {/* Decorative background element behind card */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neo-blue border-l-4 border-b-4 border-neo-border -z-10 -m-4"></div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-neo-border pb-6 gap-4">
                            <h2 className="text-3xl font-extrabold uppercase tracking-wide">Master Profile</h2>
                            <button onClick={handleSaveProfile} className="neo-btn bg-neo-green text-white px-8 py-3 text-lg">Save All Changes</button>
                        </div>

                        {/* Personal Info */}
                        <section className="bg-gray-50 border-2 border-neo-border p-6 shadow-neo">
                            <h3 className="text-xl font-bold mb-6 flex items-center uppercase"><span className="bg-neo-pink border-2 border-neo-border shadow-neo-focus w-10 h-10 flex items-center justify-center mr-3 text-lg font-black">1</span> Personal Info</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <input placeholder="Full Name" className="neo-input p-4 font-medium" value={profileData.personal_info.name} onChange={e => handlePersonalInfoChange('name', e.target.value)} />
                                <input placeholder="Email" className="neo-input p-4 font-medium" value={profileData.personal_info.email} onChange={e => handlePersonalInfoChange('email', e.target.value)} />
                                <input placeholder="Phone" className="neo-input p-4 font-medium" value={profileData.personal_info.phone} onChange={e => handlePersonalInfoChange('phone', e.target.value)} />
                                <input placeholder="LinkedIn URL" className="neo-input p-4 font-medium" value={profileData.personal_info.linkedin} onChange={e => handlePersonalInfoChange('linkedin', e.target.value)} />
                                <input placeholder="GitHub URL" className="neo-input p-4 font-medium" value={profileData.personal_info.github} onChange={e => handlePersonalInfoChange('github', e.target.value)} />
                            </div>
                        </section>

                        {/* Skills */}
                        <section className="bg-gray-50 border-2 border-neo-border p-6 shadow-neo">
                            <h3 className="text-xl font-bold mb-6 flex items-center uppercase"><span className="bg-neo-blue border-2 border-neo-border shadow-neo-focus w-10 h-10 flex items-center justify-center mr-3 text-lg font-black">2</span> Skills</h3>
                            <div className="flex gap-3 mb-5">
                                <input id="skillInput" placeholder="Add a skill (e.g. React)..." className="neo-input p-3 flex-1 text-lg" onKeyDown={(e) => { if (e.key === 'Enter') { handleSkillAdd(e.currentTarget.value); e.currentTarget.value = ''; } }} />
                                <button onClick={() => { const el = document.getElementById('skillInput') as HTMLInputElement; handleSkillAdd(el.value); el.value = ''; }} className="neo-btn bg-neo-yellow px-6 text-lg">ADD</button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {profileData.skills.map(skill => (
                                    <span key={skill} className="neo-badge bg-white px-3 py-2 flex items-center text-sm">
                                        {skill}
                                        <button onClick={() => handleSkillRemove(skill)} className="ml-3 font-bold hover:text-red-600 bg-red-100 px-2 py-0.5 border border-neo-border transition-colors">X</button>
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* Experience */}
                        <section className="bg-gray-50 border-2 border-neo-border p-6 shadow-neo">
                            <div className="flex justify-between items-center mb-6 border-b-2 border-neo-border pb-4">
                                <h3 className="text-xl font-bold flex items-center uppercase"><span className="bg-neo-yellow border-2 border-neo-border shadow-neo-focus w-10 h-10 flex items-center justify-center mr-3 text-lg font-black">3</span> Experience</h3>
                                <button onClick={addExperience} className="neo-btn bg-white px-4 py-2 text-sm">+ Add Position</button>
                            </div>
                            <div className="space-y-6">
                                {profileData.experience.map(exp => (
                                    <div key={exp.id} className="neo-card p-5 bg-white relative group transition-transform hover:-translate-y-1 hover:shadow-neo-brutal">
                                        <button onClick={() => removeExperience(exp.id)} className="absolute -top-3 -right-3 neo-btn bg-neo-pink text-black w-8 h-8 rounded-full flex items-center justify-center font-black">X</button>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <input placeholder="Company" className="neo-input p-3 font-bold" value={exp.company} onChange={e => handleExperienceChange(exp.id, 'company', e.target.value)} />
                                            <input placeholder="Role" className="neo-input p-3 font-bold" value={exp.role} onChange={e => handleExperienceChange(exp.id, 'role', e.target.value)} />
                                            <input placeholder="Duration (e.g. 2020 - Present)" className="neo-input p-3 font-bold" value={exp.duration} onChange={e => handleExperienceChange(exp.id, 'duration', e.target.value)} />
                                        </div>
                                        <textarea placeholder="Description / Key responsibilities..." className="w-full neo-input p-4 h-32 font-medium resize-y" value={exp.description} onChange={e => handleExperienceChange(exp.id, 'description', e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Projects */}
                        <section className="bg-gray-50 border-2 border-neo-border p-6 shadow-neo">
                            <div className="flex justify-between items-center mb-6 border-b-2 border-neo-border pb-4">
                                <h3 className="text-xl font-bold flex items-center uppercase"><span className="bg-neo-green border-2 border-neo-border text-white shadow-neo-focus w-10 h-10 flex items-center justify-center mr-3 text-lg font-black">4</span> Projects</h3>
                                <button onClick={addProject} className="neo-btn bg-white px-4 py-2 text-sm">+ Add Project</button>
                            </div>

                            <div className="bg-neo-blue p-5 border-2 border-neo-border shadow-neo mb-6 flex flex-col md:flex-row items-center gap-4">
                                <span className="font-bold text-black uppercase tracking-wider">Import from GitHub:</span>
                                <input
                                    className="neo-input p-3 flex-1 font-bold bg-white"
                                    placeholder="Username"
                                    value={githubUsername}
                                    onChange={(e) => setGithubUsername(e.target.value)}
                                />
                                <button onClick={fetchGithubRepos} className="neo-btn bg-white text-black px-6 py-3 uppercase">Fetch Repos</button>
                            </div>

                            <div className="space-y-6">
                                {profileData.projects.map(proj => (
                                    <div key={proj.id} className="neo-card p-5 bg-white relative group transition-transform hover:-translate-y-1 hover:shadow-neo-brutal">
                                        <button onClick={() => removeProject(proj.id)} className="absolute -top-3 -right-3 neo-btn bg-neo-pink text-black w-8 h-8 rounded-full flex items-center justify-center font-black">X</button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <input placeholder="Project Name" className="neo-input p-3 font-bold text-lg" value={proj.name} onChange={e => handleProjectChange(proj.id, 'name', e.target.value)} />
                                            <input placeholder="Tech Stack (e.g. React, Node)" className="neo-input p-3 font-bold text-neo-pink" value={proj.tech} onChange={e => handleProjectChange(proj.id, 'tech', e.target.value)} />
                                        </div>
                                        <textarea placeholder="Details / Impact..." className="w-full neo-input p-4 h-24 font-medium resize-y" value={proj.details} onChange={e => handleProjectChange(proj.id, 'details', e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Stories / Achievements */}
                        <section className="bg-gray-50 border-2 border-neo-border p-6 shadow-neo">
                            <div className="flex justify-between items-center mb-4 border-b-2 border-neo-border pb-4">
                                <h3 className="text-xl font-bold flex items-center uppercase"><span className="bg-neo-pink border-2 border-neo-border shadow-neo-focus w-10 h-10 flex items-center justify-center mr-3 text-lg font-black">5</span> Story-based Achievements</h3>
                                <button onClick={addStory} className="neo-btn bg-white px-4 py-2 text-sm">+ Add Story</button>
                            </div>
                            <p className="font-bold bg-white border-2 border-neo-border p-3 shadow-neo-focus mb-6 inline-block">Add specific stories or achievements given in a narrative format. The AI will strictly follow these facts to tailor your resume.</p>
                            <div className="space-y-6">
                                {profileData.achievements_story.map(story => (
                                    <div key={story.id} className="neo-card p-5 bg-white relative group transition-transform hover:-translate-y-1 hover:shadow-neo-brutal">
                                        <button onClick={() => removeStory(story.id)} className="absolute -top-3 -right-3 neo-btn bg-neo-pink text-black w-8 h-8 rounded-full flex items-center justify-center font-black">X</button>
                                        <input placeholder="Story Title (e.g. Database Migration)" className="w-full neo-input p-4 mb-4 font-bold text-lg" value={story.title} onChange={e => handleStoryChange(story.id, 'title', e.target.value)} />
                                        <textarea placeholder="Tell the story: What was the challenge? What did you do? What was the result?" className="w-full neo-input p-4 h-40 font-medium resize-y" value={story.story} onChange={e => handleStoryChange(story.id, 'story', e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="neo-card p-6 md:p-8 animate-fade-in relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neo-yellow border-l-4 border-b-4 border-neo-border -z-10 -m-4"></div>
                        
                        <div className="flex justify-between items-center mb-8 border-b-4 border-neo-border pb-4">
                            <h2 className="text-3xl font-extrabold uppercase bg-neo-pink inline-block px-3 py-1 border-2 border-neo-border shadow-neo">Generation History</h2>
                            <button onClick={fetchHistory} className="neo-btn bg-white px-4 py-2 font-bold shadow-neo hover:shadow-neo-brutal">REFRESH</button>
                        </div>
                        <div className="overflow-x-auto border-4 border-neo-border shadow-neo-brutal bg-white">
                            <table className="w-full text-left font-medium">
                                <thead className="bg-neo-blue text-black font-black uppercase tracking-wider border-b-4 border-neo-border">
                                    <tr>
                                        <th className="p-4 border-r-4 border-neo-border">Name</th>
                                        <th className="p-4 border-r-4 border-neo-border">Date</th>
                                        <th className="p-4 border-r-4 border-neo-border">Status</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-4 divide-neo-border">
                                    {history.map((record) => (
                                        <tr key={record.id} className="hover:bg-neo-bg transition-colors">
                                            <td className="p-4 font-bold border-r-4 border-neo-border">{record.name}</td>
                                            <td className="p-4 border-r-4 border-neo-border">{new Date(record.timestamp).toLocaleString()}</td>
                                            <td className="p-4 border-r-4 border-neo-border">
                                                <span className={`px-3 py-1 border-2 border-neo-border shadow-neo-focus font-black uppercase text-sm ${record.status === 'success' ? 'bg-neo-green text-white' : record.status === 'failed' ? 'bg-neo-pink text-black' : 'bg-neo-yellow text-black'}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="p-4 space-x-3">
                                                {record.pdf_file && (
                                                    <a href={`${API_URL}/download/${record.pdf_file}`} target="_blank" className="font-bold underline decoration-4 decoration-neo-green hover:bg-neo-green hover:text-white transition-all px-1">PDF</a>
                                                )}
                                                {record.tex_file && (
                                                    <a href={`${API_URL}/download/${record.tex_file}`} target="_blank" className="font-bold underline decoration-4 decoration-neo-blue hover:bg-neo-blue hover:text-white transition-all px-1">TeX</a>
                                                )}
                                                {record.status === 'failed' && (
                                                    <span className="font-bold text-neo-pink bg-black px-2 py-1 uppercase text-xs">Check Logs</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center font-bold text-xl uppercase bg-gray-100">No history yet. Get building!</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'generate' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in relative mt-12">
                        {/* Wake-up Banner */}
                        {backendStatus === 'sleeping' && (
                            <div className="absolute -top-12 left-0 right-0 bg-neo-blue text-white p-2 border-4 border-black font-black uppercase text-center animate-pulse z-20">
                                🔌 Backend is waking up... This usually takes 30-60 seconds on the first load. Please wait.
                            </div>
                        )}
                        {backendStatus === 'error' && (
                            <div className="absolute -top-12 left-0 right-0 bg-neo-pink text-white p-2 border-4 border-black font-black uppercase text-center z-20">
                                🛑 Error connecting to backend. Check VITE_API_URL.
                            </div>
                        )}
                        {/* Decorative background element */}
                        <div className="hidden lg:block absolute -top-4 -left-4 w-full h-full bg-neo-pink border-4 border-neo-border -z-10 opacity-20 pointer-events-none"></div>

                        <div className="lg:col-span-2 space-y-8">
                            <div className="neo-card p-6 md:p-8">
                                <h2 className="text-2xl font-black uppercase mb-4 tracking-tight"><span className="bg-neo-yellow px-2 border-2 border-neo-border shadow-neo-focus mr-2">1</span> Job Description</h2>
                                <textarea className="w-full h-48 neo-input p-4 resize-y text-lg" placeholder="Paste JD..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
                            </div>

                            <div className="neo-card p-6 md:p-8">
                                <h2 className="text-2xl font-black uppercase mb-4 tracking-tight"><span className="bg-neo-blue px-2 border-2 border-neo-border shadow-neo-focus mr-2 text-white">2</span> Configuration</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-lg font-bold mb-2">Resume Name (Optional)</label>
                                        <input type="text" className="w-full neo-input p-3 font-medium" placeholder="e.g. Frontend Dev - Google" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-lg font-bold mb-2">Select Template</label>
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={() => setIsTemplateModalOpen(true)}
                                                className="neo-btn bg-neo-yellow px-6 py-3 font-bold uppercase w-1/2 flex items-center justify-between shadow-neo hover:shadow-neo-brutal"
                                            >
                                                <span>{templates.find(t => t.id === selectedTemplate)?.name || 'Select Template'}</span>
                                                <span className="text-xl">➔</span>
                                            </button>
                                            
                                            {/* Preview Thumbnail for currently selected */}
                                            {selectedTemplate && templates.find(t => t.id === selectedTemplate)?.preview && (
                                                <div className="w-16 h-20 border-2 border-neo-border bg-white shadow-neo">
                                                    <img 
                                                        src={templates.find(t => t.id === selectedTemplate)?.preview || ''} 
                                                        alt="Selected Template" 
                                                        className="w-full h-full object-cover object-top"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="modelSelect" className="block text-lg font-bold mb-2">AI Model</label>
                                        <select id="modelSelect" className="w-full neo-input p-3 font-medium bg-white cursor-pointer" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                                            {availableModels.length > 0 ? (
                                                availableModels.map(m => <option key={m} value={m}>{m}</option>)
                                            ) : (
                                                <option value="gemini-2.5-flash">gemini-2.5-flash (Default)</option>
                                            )}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="neo-card p-6 md:p-8">
                                <h2 className="text-2xl font-black uppercase mb-4 tracking-tight"><span className="bg-neo-green px-2 border-2 border-neo-border shadow-neo-focus mr-2 text-white">3</span> AI Instructions <span className="text-sm bg-black text-white px-2 py-1 ml-2 align-middle">Optional</span></h2>
                                <textarea
                                    className="w-full h-32 neo-input p-4 resize-y font-medium"
                                    placeholder="e.g. Focus on my leadership experience, make it fit on one page, or highlight my React skills..."
                                    value={aiInstructions}
                                    onChange={(e) => setAiInstructions(e.target.value)}
                                />
                            </div>
                            
                            <button onClick={handleGenerate} disabled={generationStatus === 'loading' || !jobDescription} className={`w-full py-5 text-2xl uppercase neo-btn ${generationStatus === 'loading' || !jobDescription ? 'bg-gray-300' : 'bg-neo-pink hover:bg-white'} mt-4`}>
                                {generationStatus === 'loading' ? 'GENERATING...' : 'GENERATE RESUME'}
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div className="neo-card p-6 md:p-8 h-full flex flex-col bg-neo-yellow">
                                <h2 className="text-2xl font-black uppercase mb-4 tracking-tight border-b-4 border-black pb-2">Status & Results</h2>

                                <div className="flex-1 bg-black border-4 border-neo-border shadow-neo-focus rounded-none p-4 mb-6 overflow-y-auto font-mono text-sm text-neo-green h-64 lg:h-auto">
                                    {logs.length === 0 && <span className="text-gray-500 italic">Terminal ready...</span>}
                                    {logs.map((log, i) => <div key={i} className="mb-2 border-b border-gray-800 pb-1">{log}</div>)}
                                </div>

                                {generationStatus === 'success' && generatedFile && (
                                    <div className="bg-white border-4 border-neo-border shadow-neo-brutal p-6 text-center mb-6 transform rotate-1">
                                        <h3 className="text-2xl font-black uppercase mb-4">Success!</h3>
                                        <a href={`${API_URL}/download/${generatedFile}`} target="_blank" className="neo-btn bg-neo-green text-white block w-full py-3 text-xl uppercase">DOWNLOAD PDF</a>
                                    </div>
                                )}

                                {(generationStatus === 'success' || generationStatus === 'partial_success') && generatedTex && (
                                    <div className="bg-white border-4 border-neo-border shadow-neo p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-black uppercase">LaTeX Source</h3>
                                            <button onClick={() => navigator.clipboard.writeText(generatedTex)} className="neo-btn bg-neo-blue text-white px-3 py-1 text-xs">COPY</button>
                                        </div>
                                        <textarea readOnly title="LaTeX Source Code" className="w-full h-32 neo-input p-3 text-xs font-mono bg-gray-50" value={generatedTex} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Template Selection Modal */}
                {isTemplateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="neo-card bg-white w-full max-w-6xl max-h-[90vh] flex flex-col relative overflow-hidden">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b-4 border-neo-border bg-neo-yellow">
                                <h2 className="text-3xl font-black uppercase tracking-tight">Select a Template</h2>
                                <button 
                                    onClick={() => setIsTemplateModalOpen(false)}
                                    className="w-10 h-10 flex items-center justify-center bg-neo-pink border-4 border-neo-border shadow-neo font-black text-xl hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all"
                                >
                                    X
                                </button>
                            </div>
                            
                            {/* Modal Body (Scrollable Grid) */}
                            <div className="p-6 md:p-8 overflow-y-auto bg-neo-bg flex-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                                    {templates.map(t => (
                                        <div 
                                            key={t.id} 
                                            onClick={() => {
                                                setSelectedTemplate(t.id);
                                                setIsTemplateModalOpen(false); // Auto close on select
                                            }}
                                            className={`relative flex flex-col bg-white border-4 cursor-pointer transition-all group ${selectedTemplate === t.id ? 'border-neo-pink shadow-neo-focus translate-y-1 translate-x-1 outline outline-4 outline-neo-pink' : 'border-neo-border shadow-neo-brutal hover:shadow-neo hover:translate-y-1 hover:translate-x-1'}`}
                                        >
                                            {/* Image Container with hover zoom effect */}
                                            <div className="w-full aspect-[1/1.4] overflow-hidden border-b-4 border-neo-border relative bg-gray-50">
                                                {t.preview ? (
                                                    <>
                                                        <img 
                                                            src={t.preview} 
                                                            alt={t.name} 
                                                            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" 
                                                        />
                                                        {/* "SELECT" Overlay on hover */}
                                                        <div className="absolute inset-0 bg-neo-blue/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="bg-white border-4 border-neo-border px-6 py-2 font-black uppercase text-xl shadow-neo transform -rotate-2">Select</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                                                        <span className="text-4xl mb-2">📄</span>
                                                        <span className="font-bold uppercase text-sm text-center">No Preview<br/>Available</span>
                                                    </div>
                                                )}
                                                
                                                {/* Selected Badge */}
                                                {selectedTemplate === t.id && (
                                                    <div className="absolute top-2 right-2 bg-neo-green text-white font-black text-xs px-2 py-1 border-2 border-neo-border shadow-neo z-10">
                                                        SELECTED
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Details Container */}
                                            <div className={`p-4 text-center ${selectedTemplate === t.id ? 'bg-neo-pink text-white' : 'bg-white text-black'}`}>
                                                <h3 className="font-black text-lg uppercase truncate">{t.name}</h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
