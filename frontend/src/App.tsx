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
    const [customName, setCustomName] = useState('');
    const [githubUsername, setGithubUsername] = useState('Dexterisham');
    const [generationStatus, setGenerationStatus] = useState<'idle' | 'loading' | 'success' | 'partial_success' | 'error'>('idle');
    const [generatedFile, setGeneratedFile] = useState('');
    const [generatedTex, setGeneratedTex] = useState('');
    const [templates, setTemplates] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [history, setHistory] = useState<any[]>([]);

    const API_URL = 'http://localhost:8000';

    useEffect(() => {
        fetchProfile();
        fetchTemplates();
        fetchHistory();
    }, []);

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
        try {
            const res = await fetch(`${API_URL}/templates`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.templates);
                if (data.templates.length > 0) setSelectedTemplate(data.templates[0]);
            }
        } catch (e) {
            console.error("Failed to fetch templates", e);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/history`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history);
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

                // Filter out duplicates based on name or ID if needed, or just append
                // Here we just append, user can clean up
                setProfileData(prev => ({
                    ...prev,
                    projects: [...prev.projects, ...newProjects]
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
                    custom_name: customName
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
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            <header className="bg-indigo-600 text-white p-6 shadow-md">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">AI Resume Builder</h1>
                        <p className="text-indigo-200 text-sm">Tailor your CV with Gemini & LaTeX</p>
                    </div>
                    <div className="flex space-x-2 bg-indigo-700 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('generate')} className={`px-4 py-2 rounded-md transition duration-200 ${activeTab === 'generate' ? 'bg-white text-indigo-700 font-semibold shadow-sm' : 'text-indigo-200 hover:text-white'}`}>Generate</button>
                        <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-md transition duration-200 ${activeTab === 'history' ? 'bg-white text-indigo-700 font-semibold shadow-sm' : 'text-indigo-200 hover:text-white'}`}>History</button>
                        <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-md transition duration-200 ${activeTab === 'profile' ? 'bg-white text-indigo-700 font-semibold shadow-sm' : 'text-indigo-200 hover:text-white'}`}>Master Profile</button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6">
                {activeTab === 'profile' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in space-y-8">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Master Profile</h2>
                            <button onClick={handleSaveProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition">Save All Changes</button>
                        </div>

                        {/* Personal Info */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><span className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm">1</span> Personal Info</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input placeholder="Full Name" className="p-3 border rounded-lg" value={profileData.personal_info.name} onChange={e => handlePersonalInfoChange('name', e.target.value)} />
                                <input placeholder="Email" className="p-3 border rounded-lg" value={profileData.personal_info.email} onChange={e => handlePersonalInfoChange('email', e.target.value)} />
                                <input placeholder="Phone" className="p-3 border rounded-lg" value={profileData.personal_info.phone} onChange={e => handlePersonalInfoChange('phone', e.target.value)} />
                                <input placeholder="LinkedIn URL" className="p-3 border rounded-lg" value={profileData.personal_info.linkedin} onChange={e => handlePersonalInfoChange('linkedin', e.target.value)} />
                                <input placeholder="GitHub URL" className="p-3 border rounded-lg" value={profileData.personal_info.github} onChange={e => handlePersonalInfoChange('github', e.target.value)} />
                            </div>
                        </section>

                        {/* Skills */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><span className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm">2</span> Skills</h3>
                            <div className="flex gap-2 mb-3">
                                <input id="skillInput" placeholder="Add a skill (e.g. React)..." className="p-2 border rounded-lg flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { handleSkillAdd(e.currentTarget.value); e.currentTarget.value = ''; } }} />
                                <button onClick={() => { const el = document.getElementById('skillInput') as HTMLInputElement; handleSkillAdd(el.value); el.value = ''; }} className="bg-gray-200 hover:bg-gray-300 px-4 rounded-lg font-medium text-gray-700">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {profileData.skills.map(skill => (
                                    <span key={skill} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                                        {skill}
                                        <button onClick={() => handleSkillRemove(skill)} className="ml-2 text-indigo-400 hover:text-indigo-900">×</button>
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* Experience */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-700 flex items-center"><span className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm">3</span> Experience</h3>
                                <button onClick={addExperience} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-md text-sm font-medium">+ Add Position</button>
                            </div>
                            <div className="space-y-4">
                                {profileData.experience.map(exp => (
                                    <div key={exp.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative group">
                                        <button onClick={() => removeExperience(exp.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">Remove</button>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                            <input placeholder="Company" className="p-2 border rounded" value={exp.company} onChange={e => handleExperienceChange(exp.id, 'company', e.target.value)} />
                                            <input placeholder="Role" className="p-2 border rounded" value={exp.role} onChange={e => handleExperienceChange(exp.id, 'role', e.target.value)} />
                                            <input placeholder="Duration (e.g. 2020 - Present)" className="p-2 border rounded" value={exp.duration} onChange={e => handleExperienceChange(exp.id, 'duration', e.target.value)} />
                                        </div>
                                        <textarea placeholder="Description / Key responsibilities..." className="w-full p-2 border rounded h-24 text-sm" value={exp.description} onChange={e => handleExperienceChange(exp.id, 'description', e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Projects */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-700 flex items-center"><span className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm">4</span> Projects</h3>
                                <button onClick={addProject} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-md text-sm font-medium">+ Add Project</button>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 mb-4 flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-600">Import from GitHub:</span>
                                <input
                                    className="p-2 border rounded text-sm w-48"
                                    placeholder="Username"
                                    value={githubUsername}
                                    onChange={(e) => setGithubUsername(e.target.value)}
                                />
                                <button onClick={fetchGithubRepos} className="bg-gray-800 text-white px-3 py-1.5 rounded text-sm hover:bg-black transition">Fetch Repos</button>
                            </div>

                            <div className="space-y-4">
                                {profileData.projects.map(proj => (
                                    <div key={proj.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative group">
                                        <button onClick={() => removeProject(proj.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">Remove</button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                            <input placeholder="Project Name" className="p-2 border rounded" value={proj.name} onChange={e => handleProjectChange(proj.id, 'name', e.target.value)} />
                                            <input placeholder="Tech Stack (e.g. React, Node)" className="p-2 border rounded" value={proj.tech} onChange={e => handleProjectChange(proj.id, 'tech', e.target.value)} />
                                        </div>
                                        <textarea placeholder="Details / Impact..." className="w-full p-2 border rounded h-20 text-sm" value={proj.details} onChange={e => handleProjectChange(proj.id, 'details', e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Stories / Achievements */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-700 flex items-center"><span className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm">5</span> Story-based Achievements</h3>
                                <button onClick={addStory} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-md text-sm font-medium">+ Add Story</button>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">Add specific stories or achievements given in a narrative format. The AI will strictly follow these facts to tailor your resume.</p>
                            <div className="space-y-4">
                                {profileData.achievements_story.map(story => (
                                    <div key={story.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative group">
                                        <button onClick={() => removeStory(story.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">Remove</button>
                                        <input placeholder="Story Title (e.g. Database Migration)" className="w-full p-2 border rounded mb-2 font-medium" value={story.title} onChange={e => handleStoryChange(story.id, 'title', e.target.value)} />
                                        <textarea placeholder="Tell the story: What was the challenge? What did you do? What was the result?" className="w-full p-2 border rounded h-32 text-sm" value={story.story} onChange={e => handleStoryChange(story.id, 'story', e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-700">Generation History</h2>
                            <button onClick={fetchHistory} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Refresh</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 border-b">Name</th>
                                        <th className="p-4 border-b">Date</th>
                                        <th className="p-4 border-b">Status</th>
                                        <th className="p-4 border-b">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50 transition">
                                            <td className="p-4 font-medium text-gray-800">{record.name}</td>
                                            <td className="p-4">{new Date(record.timestamp).toLocaleString()}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${record.status === 'success' ? 'bg-green-100 text-green-700' : record.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="p-4 space-x-2">
                                                {record.pdf_file && (
                                                    <a href={`${API_URL}/download/${record.pdf_file}`} target="_blank" className="text-indigo-600 hover:underline">Download PDF</a>
                                                )}
                                                {record.tex_file && (
                                                    <a href={`${API_URL}/download/${record.tex_file}`} target="_blank" className="text-blue-600 hover:underline">Download TeX</a>
                                                )}
                                                {record.status === 'failed' && (
                                                    <span className="text-gray-400 italic">Check Logs</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-400">No history yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'generate' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-bold text-gray-700 mb-4">1. Job Description</h2>
                                <textarea className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Paste JD..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-bold text-gray-700 mb-4">2. Configuration</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Resume Name (Optional)</label>
                                        <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Frontend Dev - Google" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
                                        <select className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                                            {templates.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={handleGenerate} disabled={generationStatus === 'loading' || !jobDescription} className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition transform active:scale-95 ${generationStatus === 'loading' || !jobDescription ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'}`}>
                                        {generationStatus === 'loading' ? 'Generating...' : 'Generate Resume'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
                                <h2 className="text-lg font-bold text-gray-700 mb-4">3. Status & Results</h2>

                                <div className="flex-1 bg-gray-900 rounded-lg p-4 mb-4 overflow-y-auto font-mono text-xs text-green-400 h-64 border border-gray-800">
                                    {logs.length === 0 && <span className="text-gray-500 italic">Ready...</span>}
                                    {logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
                                </div>

                                {generationStatus === 'success' && generatedFile && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center mb-4">
                                        <h3 className="text-green-800 font-bold mb-2">Success!</h3>
                                        <a href={`${API_URL}/download/${generatedFile}`} target="_blank" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium">Download PDF</a>
                                    </div>
                                )}

                                {(generationStatus === 'success' || generationStatus === 'partial_success') && generatedTex && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-yellow-800 font-bold">LaTeX Source</h3>
                                            <button onClick={() => navigator.clipboard.writeText(generatedTex)} className="text-xs text-yellow-700 underline hover:text-yellow-900">Copy</button>
                                        </div>
                                        <textarea readOnly className="w-full h-32 p-2 text-xs font-mono border border-yellow-300 rounded bg-white text-gray-600" value={generatedTex} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
