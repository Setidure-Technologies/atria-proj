const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * EXACT conversion of Python process_psychometric_data function
 */
function processPsychometricData(webhookData) {
    // 1) Extract the main data object - handle different possible structures
    let body = null;
    let data = null;
    
    if (webhookData.body && webhookData.body.data) {
        // Structure: { body: { data: {...} } }
        body = webhookData.body;
        data = webhookData.body.data;
    } else if (webhookData.data) {
        // Structure: { data: {...} }
        body = webhookData;
        data = webhookData.data;
    } else {
        // Fallback: use the entire object as data
        body = webhookData;
        data = webhookData;
    }
    
    // Validate that we have the essential data
    if (!data) {
        throw new Error('No assessment data found in webhook payload');
    }
    
    if (!data.student_name || !data.student_email) {
        throw new Error('Missing student information (name or email) in the data');
    }
    
    // 2) Candidate information
    const candidate = {
        id: data.id || 'Unknown',
        name: data.student_name,
        email: data.student_email,
        created_at: data.created_at || new Date().toISOString()
    };
    
    // 3) Domain scores with proper fallbacks
    const detailedScores = data.detailed_scores || {};
    const domainScores = {
        executing: parseFloat(detailedScores.executing || data.executing_score || 0),
        influencing: parseFloat(detailedScores.influencing || data.influencing_score || 0),
        relationship_building: parseFloat(detailedScores.relationshipBuilding || data.relationship_building_score || 0),
        strategic_thinking: parseFloat(detailedScores.strategicThinking || data.strategic_thinking_score || 0),
        primary_talent_domain: data.primary_talent_domain || 'Not Specified'
    };
    
    // 4) Process subdomain/strength scores
    let subdomains = detailedScores.subdomains || {};
    
    // If no subdomains found, create a fallback structure
    if (!subdomains || Object.keys(subdomains).length === 0) {
        console.warn('Warning: No subdomain scores found. Using domain scores as fallback.');
        subdomains = {
            'Analytical': domainScores.strategic_thinking,
            'Relator': domainScores.relationship_building,
            'Communication': domainScores.influencing,
            'Achiever': domainScores.executing
        };
    }
    
    // Theme → Domain mapping (CliftonStrengths style)
    const domainMap = {
        // Executing Domain
        'Achiever': "Executing",
        'Arranger': "Executing", 
        'Belief': "Executing",
        'Consistency': "Executing",
        'Deliberative': "Executing",
        'Discipline': "Executing",
        'Focus': "Executing",
        'Responsibility': "Executing",
        'Restorative': "Executing",

        // Influencing Domain
        'Activator': "Influencing",
        'Command': "Influencing",
        'Communication': "Influencing",
        'Competition': "Influencing",
        'Maximizer': "Influencing",
        'SelfAssurance': "Influencing",
        'Significance': "Influencing",
        'Woo': "Influencing",

        // Relationship Building Domain
        'Adaptability': "Relationship Building",
        'Connectedness': "Relationship Building",
        'Developer': "Relationship Building",
        'Empathy': "Relationship Building",
        'Harmony': "Relationship Building",
        'Includer': "Relationship Building",
        'Individualization': "Relationship Building",
        'Positivity': "Relationship Building",
        'Relator': "Relationship Building",

        // Strategic Thinking Domain
        'Analytical': "Strategic Thinking",
        'Context': "Strategic Thinking",
        'Futuristic': "Strategic Thinking",
        'Ideation': "Strategic Thinking",
        'Input': "Strategic Thinking",
        'Intellection': "Strategic Thinking",
        'Learner': "Strategic Thinking",
        'Strategic': "Strategic Thinking"
    };
    
    // Convert strength scores
    const strengthScores = {};
    for (const [name, rawScore] of Object.entries(subdomains)) {
        strengthScores[name] = parseFloat(rawScore) || 0.0;
    }
    
    // Create list of all themes with scores and domains
    const allThemes = [];
    for (const [name, score] of Object.entries(strengthScores)) {
        allThemes.push({
            name: name,
            score: score,
            domain: domainMap[name] || "Unknown"
        });
    }
    
    // Sort by score (descending), then alphabetically
    allThemes.sort((a, b) => {
        if (a.score !== b.score) {
            return b.score - a.score;
        }
        return a.name.localeCompare(b.name);
    });
    
    // Get top 5
    const top5 = allThemes.slice(0, 5);
    
    // Generate all possible pairs from top 5
    const top5Pairs = [];
    for (let i = 0; i < top5.length; i++) {
        for (let j = i + 1; j < top5.length; j++) {
            top5Pairs.push({
                themeA: top5[i],
                themeB: top5[j],
                pairLabel: `${top5[i].name} + ${top5[j].name}`
            });
        }
    }
    
    const processedData = {
        candidate: candidate,
        domainScores: domainScores,
        strength_scores: strengthScores,
        allThemes: allThemes,
        top5: top5,
        top5Pairs: top5Pairs,
        responses: data.responses,
        raw: body
    };
    
    return processedData;
}

/**
 * EXACT conversion of Python get_elaborate_theme_description function
 */
function getElaborateThemeDescription(themeName) {
    const themeData = {
        'Ideation': {
            'description': 'You are fascinated by ideas and enjoy making connections between seemingly disparate phenomena. You thrive on creativity and innovation, constantly generating new concepts and possibilities.',
            'elaborate_description': 'Your Ideation strength means you are naturally curious and imaginative. You see the world as a place full of possibilities and connections that others might miss. You enjoy brainstorming sessions and can often come up with innovative solutions to complex problems. This strength helps you think outside the box and approach challenges from unique angles.',
            'domain': 'Strategic Thinking',
            'core_characteristics': [
                'Natural curiosity and imagination',
                'Ability to see patterns and connections',
                'Comfort with abstract thinking',
                'Enjoyment of brainstorming and idea generation',
                'Innovative problem-solving approach'
            ],
            'personal_life': [
                'Nurture curiosity by exploring new hobbies or topics, helping you stay intellectually engaged and stimulated',
                'Use your innovative mindset to brainstorm creative solutions for everyday problems at home and in personal relationships',
                'Reframe challenges as opportunities for growth and development, seeing obstacles as chances to innovate',
                'Keep an idea journal to capture your creative thoughts and insights as they occur throughout the day',
                'Engage in activities that stimulate your imagination, such as reading diverse genres, visiting museums, or learning new skills'
            ],
            'education': [
                'Approach studies with an open mind, actively seeking out diverse perspectives and unconventional ideas to broaden your understanding',
                'Generate multiple approaches when tackling complex academic problems, allowing you to find the most innovative solutions',
                'Use your creativity to develop unique and memorable solutions for group projects, presentations, and research papers',
                'Connect concepts across different disciplines to create integrated knowledge and novel insights',
                'Participate in debates and discussions where you can explore and develop your ideas through dialogue with others'
            ],
            'career': [
                'Contribute innovative ideas during brainstorming sessions, team meetings, or problem-solving discussions, bringing fresh perspectives',
                'Develop creative strategies when leading or managing projects, finding new ways to achieve objectives efficiently',
                'Approach problems from multiple angles to find the most effective and innovative solutions that others might overlook',
                'Volunteer for projects that require creative thinking and innovation, positioning yourself as a valuable idea generator',
                'Create systems for capturing and developing ideas that can benefit your organization long-term'
            ],
            'development_tips': [
                'Balance idea generation with implementation - set deadlines for moving from conception to action',
                'Practice explaining your ideas clearly to others who may not share your natural creative thinking style',
                'Find mentors or colleagues who can help you evaluate which ideas are most practical and valuable',
                'Create a system to prioritize your best concepts rather than pursuing every possibility',
                'Schedule regular creative time while also maintaining focus on execution and completion'
            ]
        },
        'Analytical': {
            'description': 'You search for reasons and causes and think about all the factors that might affect a situation. You value data, evidence, and logical reasoning.',
            'elaborate_description': 'Your Analytical strength means you have a natural tendency to examine information carefully and systematically. You enjoy breaking down complex problems into manageable components and examining each piece methodically. This strength makes you an excellent critical thinker who can identify flaws in reasoning and spot patterns others miss.',
            'domain': 'Strategic Thinking',
            'core_characteristics': [
                'Systematic and methodical thinking',
                'Strong critical thinking skills',
                'Data-driven decision making',
                'Attention to detail and accuracy',
                'Logical reasoning ability'
            ],
            'personal_life': [
                'Evaluate and analyze your own decisions systematically, learning from both successes and failures through careful reflection',
                'Analyze different viewpoints when resolving conflicts or making important life decisions, considering all relevant factors',
                'Improve planning skills by examining potential challenges and solutions before committing to courses of action',
                'Use data and research to make informed personal decisions about health, finances, and relationships',
                'Develop systems for organizing information that help you make better decisions in daily life'
            ],
            'education': [
                'Break down complex academic subjects into manageable, logical components for deeper and more thorough understanding',
                'Critically analyze sources when conducting research or writing papers, evaluating credibility and bias systematically',
                'Develop analytical skills when collaborating on group projects or studying together with peers, helping the team think more clearly',
                'Create detailed study plans that account for different learning objectives and potential challenges',
                'Practice identifying assumptions and evaluating arguments in academic materials across all subjects'
            ],
            'career': [
                'Approach challenges by breaking them down into smaller, manageable parts and analyzing each component systematically',
                'Analyze data and information thoroughly to make informed decisions or recommendations that stand up to scrutiny',
                'Use critical thinking when problem-solving or developing strategies for projects or teams, ensuring logical consistency',
                'Develop systems for quality control and error checking in your work and your team output',
                'Create detailed reports and analyses that help your organization make evidence-based decisions'
            ],
            'development_tips': [
                'Remember that not all decisions require extensive analysis - practice identifying when good enough is sufficient',
                'Balance your analytical nature with intuition and emotional intelligence in interpersonal situations',
                'Learn to present your analytical findings in ways that are accessible to non-analytical thinkers',
                'Set time limits for analysis to prevent analysis paralysis on less critical decisions',
                'Seek out diverse perspectives to complement your analytical approach with other ways of thinking'
            ]
        },
        'Harmony': {
            'description': 'You look for consensus and areas of agreement, avoiding conflict whenever possible. You value peaceful, productive environments.',
            'elaborate_description': 'Your Harmony strength means you have a natural ability to sense and create agreement among people. You can often identify common ground where others see only differences. This strength makes you a natural mediator and team player who helps groups work together productively.',
            'domain': 'Relationship Building',
            'core_characteristics': [
                'Conflict avoidance and resolution skills',
                'Empathy and understanding of others perspectives',
                'Ability to find common ground',
                'Preference for cooperative environments',
                'Strong listening and communication skills'
            ],
            'personal_life': [
                'Cultivate empathy by actively listening to others and genuinely seeking to understand their feelings and perspectives',
                'Practice active communication, ensuring that your words and actions consistently promote harmony and mutual understanding',
                'Build strong, lasting relationships by demonstrating consistent respect, kindness, and compassion in all interactions',
                'Create peaceful home environments where family members feel safe expressing themselves and resolving differences constructively',
                'Develop skills in mediation and conflict resolution that you can apply in personal relationships and community settings'
            ],
            'education': [
                'Collaborate effectively with classmates on group projects, actively seeking common ground and shared goals among diverse team members',
                'Foster positive, supportive relationships with teachers, professors, or mentors to enhance learning experiences and academic success',
                'Use active listening skills when working together during study sessions or class discussions, ensuring all voices are heard and valued',
                'Help create inclusive classroom environments where diverse perspectives are respected and everyone feels comfortable participating',
                'Develop study groups and collaborative learning opportunities that leverage the strengths of different individuals'
            ],
            'career': [
                'Build strong, collaborative teams by fostering a supportive work environment where people feel valued and understood',
                'Communicate effectively and empathetically with colleagues, clients, or team members, building trust and mutual respect',
                'Resolve conflicts constructively by finding mutually beneficial solutions that address everyone core concerns and interests',
                'Help create organizational cultures that value cooperation, respect, and positive working relationships',
                'Serve as a bridge between different departments or teams with competing priorities, finding ways to align goals and efforts'
            ],
            'development_tips': [
                'Learn to recognize when harmony might be preventing necessary conversations or decisions from happening',
                'Develop skills for having difficult conversations while maintaining relationships and respect',
                'Balance your desire for harmony with the need to address important issues directly and honestly',
                'Practice asserting your own needs and perspectives while still valuing others viewpoints',
                'Recognize that some productive conflict can lead to better outcomes than artificial harmony'
            ]
        },
        'Intellection': {
            'description': 'You are characterized by your intellectual activity and introspection. You enjoy thinking, reflection, and mental stimulation.',
            'elaborate_description': 'Your Intellection strength means you have a rich inner world of thought and reflection. You enjoy thinking deeply about ideas, concepts, and experiences. This strength makes you naturally philosophical and thoughtful, often providing deep insights that come from careful consideration.',
            'domain': 'Strategic Thinking',
            'core_characteristics': [
                'Deep thinking and reflection',
                'Intellectual curiosity',
                'Introspection and self-awareness',
                'Enjoyment of complex ideas',
                'Philosophical orientation'
            ],
            'personal_life': [
                'Engage in regular self-reflection to understand your own values, goals, and motivations at a deeper level',
                'Pursue lifelong learning through reading diverse materials, attending workshops, or engaging in online courses that challenge your thinking',
                'Cultivate curiosity about the world around you, actively seeking new experiences and knowledge that expand your understanding',
                'Create time and space for uninterrupted thinking and reflection in your daily routine',
                'Develop practices like journaling or meditation that support your natural tendency toward introspection and self-awareness'
            ],
            'education': [
                'Reflect deeply on your own learning process to identify strengths, areas for improvement, and optimal learning strategies',
                'Engage in self-directed learning by pursuing topics of personal intellectual interest beyond required coursework',
                'Develop sophisticated critical thinking skills by questioning assumptions and seeking deeper understanding of complex ideas',
                'Connect academic learning to broader philosophical questions and real-world applications',
                'Participate in advanced seminars, independent studies, or research projects that allow for deep intellectual engagement'
            ],
            'career': [
                'Continuously develop your professional expertise through advanced workshops, training programs, or mentorship opportunities',
                'Approach projects with intellectual curiosity, seeking innovative solutions to complex problems through deep analysis',
                'Cultivate an environment of continuous learning and intellectual growth within teams or organizations you work with',
                'Provide thoughtful, well-considered perspectives in meetings and decision-making processes',
                'Mentor others in developing their own critical thinking and reflective practices'
            ],
            'development_tips': [
                'Balance reflection with action - ensure your deep thinking leads to practical applications and decisions',
                'Practice communicating your complex thoughts in ways that are accessible to others with different thinking styles',
                'Set boundaries around your thinking time to prevent over-analysis or excessive introspection',
                'Seek out others who appreciate deep conversation and intellectual exchange',
                'Apply your reflective abilities to practical problem-solving as well as philosophical questions'
            ]
        },
        'Strategic': {
            'description': 'You create alternative ways to proceed and can quickly spot relevant patterns and issues in any scenario.',
            'elaborate_description': 'Your Strategic strength means you have a natural ability to see the big picture while also understanding how different elements interact. You can quickly identify patterns, anticipate obstacles, and develop multiple pathways to achieve goals. This strength allows you to navigate complexity effectively.',
            'domain': 'Strategic Thinking',
            'core_characteristics': [
                'Pattern recognition',
                'Future-oriented thinking',
                'Scenario planning ability',
                'Big picture perspective',
                'Adaptive planning skills'
            ],
            'personal_life': [
                'Plan for the future by setting clear, achievable goals and breaking them down into manageable, actionable steps with timelines',
                'Approach decision-making with a long-term perspective, carefully considering potential consequences and outcomes for important life choices',
                'Use your strategic mindset to navigate everyday challenges more effectively, anticipating obstacles and preparing contingency plans',
                'Develop personal systems and routines that optimize your time, energy, and resources toward your most important objectives',
                'Help friends and family with planning and decision-making, bringing your strategic perspective to their important life choices'
            ],
            'education': [
                'Develop comprehensive study strategies by planning ahead and anticipating potential challenges in courses and assignments',
                'Utilize advanced time management skills to ensure you meet academic deadlines while maintaining a healthy work-life balance',
                'Use your strategic thinking to develop innovative approaches when tackling complex academic problems or research projects',
                'Plan your academic career strategically, choosing courses, extracurriculars, and opportunities that align with your long-term goals',
                'Create backup plans for important academic milestones like exams, projects, and applications'
            ],
            'career': [
                'Contribute valuable strategic insights during planning discussions or decision-making meetings, helping organizations see the bigger picture',
                'Approach projects with a long-term perspective, considering potential outcomes and implications for the organization as a whole',
                'Use your strategic thinking to develop innovative solutions to complex business challenges that account for multiple variables',
                'Help teams and organizations develop strategic plans that are both ambitious and achievable',
                'Anticipate industry trends and organizational needs, positioning yourself and your team for future success'
            ],
            'development_tips': [
                'Balance long-term planning with flexibility - be prepared to adapt your strategies as circumstances change',
                'Practice communicating your strategic vision in ways that inspire and motivate others',
                'Remember to celebrate short-term wins while working toward long-term goals',
                'Seek input from others to ensure your strategic plans account for practical realities and diverse perspectives',
                'Develop skills in both strategy formulation and execution to ensure your plans translate into results'
            ]
        }
    };
    
    // Return default structure if theme not found
    const defaultStructure = {
        'description': 'This strength represents a unique talent pattern that influences your behavior and thinking.',
        'elaborate_description': 'This strength contributes to your unique approach to challenges and opportunities.',
        'domain': 'Unknown',
        'core_characteristics': ['Characteristic 1', 'Characteristic 2'],
        'personal_life': ['Apply this strength in personal contexts', 'Use it to enhance daily life'],
        'education': ['Apply in learning environments', 'Use for academic success'],
        'career': ['Apply in professional settings', 'Use for career advancement'],
        'development_tips': ['Continue developing this strength', 'Balance with other approaches']
    };
    
    return themeData[themeName] || defaultStructure;
}

/**
 * EXACT conversion of Python get_detailed_combo_analysis function
 */
function getDetailedComboAnalysis(theme1, theme2) {
    const comboData = {
        'Ideation,Analytical': {
            'name': 'Strategic Inspiration',
            'positive_synergy': 'When Ideation and Analytical come together, a powerful engine of strategic inspiration is ignited. This combination allows you to generate numerous creative ideas while critically evaluating their feasibility and potential impact. Your thought processes are fueled by both creativity and logic, enabling you to develop innovative solutions with solid foundations.',
            'risks': 'Overusing Ideation and Analytical could lead to spending excessive time exploring ideas without taking decisive action or becoming paralyzed by choosing between multiple viable options. In some cases, this combination might cause you to overthink situations, leading to indecision or analysis paralysis.',
            'practical_applications': [
                'Use in innovation teams where both creative thinking and practical evaluation are needed',
                'Excellent for research and development roles that require both imagination and rigor',
                'Valuable in strategic planning where multiple scenarios need to be generated and assessed',
                'Effective in consulting roles that require both creative problem-solving and analytical depth'
            ],
            'balance_strategies': [
                'Set clear deadlines for moving from ideation to decision-making',
                'Use the good enough principle for less critical decisions',
                'Practice rapid prototyping rather than perfect planning',
                'Seek input from more action-oriented colleagues when needed'
            ]
        }
        // Add more combinations as needed
    };
    
    const key = `${theme1},${theme2}`;
    const reverseKey = `${theme2},${theme1}`;
    
    const defaultCombo = {
        'name': `${theme1} + ${theme2} Combination`,
        'positive_synergy': `The combination of ${theme1} and ${theme2} creates a unique blend of talents that can be powerfully applied across various contexts.`,
        'risks': `When overused, this combination might lead to imbalanced approaches that favor one strength over the other.`,
        'practical_applications': [
            `Apply both ${theme1} and ${theme2} in team settings`,
            `Use this combination for complex problem-solving`,
            `Leverage both strengths in leadership roles`
        ],
        'balance_strategies': [
            `Balance the use of ${theme1} and ${theme2}`,
            `Seek feedback on when to emphasize each strength`,
            `Practice integrating both strengths smoothly`
        ]
    };
    
    return comboData[key] || comboData[reverseKey] || defaultCombo;
}

/**
 * EXACT conversion of Python generate_comprehensive_pdf function
 */
async function generateComprehensivePDF(processedData, outputFilename = "comprehensive_strength_report.pdf") {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document with A4 size and margins
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 36,
                    bottom: 36,
                    left: 36,
                    right: 36
                }
            });
            
            const chunks = [];
            
            // Collect PDF data
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                resolve({
                    success: true,
                    buffer: pdfBuffer,
                    filename: outputFilename
                });
            });

            const candidate = processedData.candidate;
            
            // Colors matching Python version
            const primaryColor = '#2E86AB';
            const secondaryColor = '#A23B72';
            
            // 1. Enhanced Visual Cover Page
            doc.fontSize(24)
               .fillColor('#2563eb')
               .text('StrengthsFinder 360 Report', 50, 50);
            doc.fontSize(16)
               .fillColor('#64748b')
               .text('Personalized Talent Assessment Results', 50, 85);
            
            // Candidate Information Box
            doc.fontSize(18)
               .fillColor('#1e293b')
               .text('Candidate Information', 50, 130);
            doc.fontSize(12)
               .fillColor('#475569');
            doc.text(`Name: ${candidate.name}`, 50, 160);
            doc.text(`Email: ${candidate.email}`, 50, 180);
            doc.text(`Assessment Date: ${new Date(candidate.created_at).toLocaleDateString()}`, 50, 200);
            doc.text(`Report ID: ${candidate.id}`, 50, 220);
            
            // Primary Talent Domain Highlight
            doc.fontSize(16)
               .fillColor('#1e293b')
               .text('Primary Talent Domain', 50, 260);
            doc.fontSize(14)
               .fillColor('#2563eb')
               .text(processedData.domainScores.primary_talent_domain, 50, 285);
            
            doc.moveDown(2);
            doc.fontSize(11)
               .fillColor('#374151')
               .text('This comprehensive report provides detailed insights into your unique strengths pattern, practical applications, and development strategies for personal and professional growth.', 50, 320, {
                width: 500,
                align: 'justify'
            });
            
            doc.addPage();
            
            // 2. Visual Domain Scores Section with Progress Bars
            doc.fontSize(18)
               .fillColor('#1e293b')
               .text('Talent Domain Scores', 50, 50);
            
            let yPosition = 90;
            const domains = [
                { 
                    name: 'Executing', 
                    score: processedData.domainScores.executing, 
                    color: '#dc2626',
                    description: 'People who execute make things happen'
                },
                { 
                    name: 'Influencing', 
                    score: processedData.domainScores.influencing, 
                    color: '#ea580c',
                    description: 'People who influence help teams reach broader audiences'
                },
                { 
                    name: 'Relationship Building', 
                    score: processedData.domainScores.relationship_building, 
                    color: '#16a34a',
                    description: 'People who build relationships hold teams together'
                },
                { 
                    name: 'Strategic Thinking', 
                    score: processedData.domainScores.strategic_thinking, 
                    color: '#2563eb',
                    description: 'People who think strategically focus on what could be'
                }
            ];
            
            domains.forEach(domain => {
                // Domain name
                doc.fontSize(14)
                   .fillColor('#374151')
                   .text(domain.name, 50, yPosition);
                
                // Score
                doc.fontSize(12)
                   .fillColor('#6b7280')
                   .text(`${domain.score.toFixed(1)}`, 250, yPosition + 2);
                
                // Progress bar background
                doc.rect(300, yPosition + 2, 200, 12)
                   .fillColor('#e5e7eb')
                   .fill();
                
                // Progress bar fill
                const maxScore = Math.max(...domains.map(d => d.score));
                let fillWidth = 0;
                if (maxScore > 0 && !isNaN(domain.score) && domain.score > 0) {
                    fillWidth = (domain.score / maxScore) * 200;
                }
                if (!isNaN(fillWidth) && fillWidth > 0) {
                    doc.rect(300, yPosition + 2, fillWidth, 12)
                       .fillColor(domain.color)
                       .fill();
                }
                
                // Description
                doc.fontSize(9)
                   .fillColor('#6b7280')
                   .text(domain.description, 50, yPosition + 18, { width: 450 });
                
                yPosition += 45;
            });
            
            // Primary Talent Domain Highlight Box
            doc.rect(50, yPosition + 20, 500, 60)
               .fillColor('#f8fafc')
               .stroke('#e2e8f0');
            
            doc.fontSize(16)
               .fillColor('#1e293b')
               .text('Primary Talent Domain', 60, yPosition + 35);
            doc.fontSize(14)
               .fillColor('#2563eb')
               .text(processedData.domainScores.primary_talent_domain, 60, yPosition + 55);
            
            doc.addPage();
            
            // 3. Visual Top Themes Section
            doc.fontSize(18)
               .fillColor('#1e293b')
               .text('Top Talent Themes', 50, 50);
            
            // Sort themes by score and get top 10 for visual display
            const sortedThemes = Object.entries(processedData.strength_scores)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10);
            
            // Check if all scores are zero (incomplete test)
            const allScoresZero = sortedThemes.every(([,score]) => score === 0);
            
            if (allScoresZero) {
                // Handle incomplete test case
                doc.fontSize(14)
                   .fillColor('#dc2626')
                   .text('Assessment Incomplete', 50, 90);
                   
                doc.fontSize(12)
                   .fillColor('#6b7280')
                   .text('This assessment appears to be incomplete. All scores are zero, which suggests the test was not properly completed.', 50, 120, {
                       width: 500,
                       align: 'left'
                   });
                   
                doc.text('Please retake the assessment to generate a comprehensive report.', 50, 160, {
                    width: 500,
                    align: 'left'
                });
                
                // Skip to footer
                doc.fontSize(10)
                   .fillColor('#9ca3af')
                   .text('This report is generated by StrengthsFinder 360 Assessment Tool', 50, doc.page.height - 70, { align: 'center' });
                   
                doc.fontSize(8)
                   .fillColor('#6b7280')
                   .text(`Generated on ${new Date().toLocaleDateString()} • Report ID: ${candidate.id}`, 50, doc.page.height - 50, { align: 'center' });
                
                // Finalize PDF early for incomplete tests
                doc.end();
                return;
            }
            
            let themeYPosition = 90;
            sortedThemes.forEach(([theme, score], index) => {
                const isTop5 = index < 5;
                const bgColor = isTop5 ? '#f0f9ff' : '#f9fafb';
                const borderColor = isTop5 ? '#3b82f6' : '#e5e7eb';
                const textColor = isTop5 ? '#1e40af' : '#374151';
                
                // Theme box
                doc.rect(50, themeYPosition, 500, 25)
                   .fillColor(bgColor)
                   .stroke(borderColor);
                
                doc.fontSize(12)
                   .fillColor(textColor)
                   .text(`${index + 1}. ${theme}`, 60, themeYPosition + 8);
                
                doc.fontSize(10)
                   .fillColor('#6b7280')
                   .text(`Score: ${typeof score === 'number' ? score.toFixed(1) : score}`, 350, themeYPosition + 8);
                
                // Mini progress bar
                const barWidth = 80;
                const maxThemeScore = Math.max(...sortedThemes.map(([,s]) => s));
                let themeFillWidth = 0;
                if (maxThemeScore > 0 && !isNaN(score) && score > 0) {
                    themeFillWidth = (score / maxThemeScore) * barWidth;
                }
                
                doc.rect(450, themeYPosition + 8, barWidth, 8)
                   .fillColor('#e5e7eb')
                   .fill();
                
                if (!isNaN(themeFillWidth) && themeFillWidth > 0) {
                    doc.rect(450, themeYPosition + 8, themeFillWidth, 8)
                       .fillColor(isTop5 ? '#3b82f6' : '#9ca3af')
                       .fill();
                }
                
                themeYPosition += 30;
            });
            
            doc.addPage();
            
            // 4. Enhanced Executive Summary with Visual Elements
            doc.fontSize(18)
               .fillColor('#1e293b')
               .text('Executive Summary', 50, 50);
            
            // Summary box with background
            doc.rect(50, 80, 500, 120)
               .fillColor('#f8fafc')
               .stroke('#e2e8f0');
            
            doc.fontSize(11)
               .fillColor('#374151')
               .text(`This Strength-360 assessment reveals that ${candidate.name} demonstrates a distinctive talent pattern with dominant emphasis on ${processedData.domainScores.primary_talent_domain}. Your unique combination of strengths suggests particular aptitudes for roles requiring strategic thinking, innovation, and complex problem-solving.`, 60, 95, {
                   width: 480,
                   align: 'justify'
               });
            
            doc.text('This comprehensive report provides detailed insights into your unique strengths pattern, practical applications, and development strategies for personal and professional growth across all life domains.', 60, 150, {
                width: 480,
                align: 'justify'
            });
            
            doc.addPage();
            
            // 5. Your Top 5 Signature Strengths Analysis with Enhanced Visuals
            doc.fontSize(18)
               .fillColor('#1e293b')
               .text('Your Top 5 Signature Strengths', 50, 50);
            
            let currentY = 80;
            
            processedData.top5.forEach((theme, index) => {
                const themeInfo = getElaborateThemeDescription(theme.name);
                
                // Check if we need a new page
                if (currentY > 600) {
                    doc.addPage();
                    currentY = 50;
                }
                
                // Enhanced Strength Header with colored box
                const domainColors = {
                    'Executing': '#dc2626',
                    'Influencing': '#ea580c',
                    'Relationship Building': '#16a34a',
                    'Strategic Thinking': '#2563eb'
                };
                
                const themeColor = domainColors[themeInfo.domain] || '#6b7280';
                
                // Colored header box
                doc.rect(50, currentY, 500, 30)
                   .fillColor('#f8fafc')
                   .stroke(themeColor);
                
                doc.fontSize(14)
                   .fillColor(themeColor)
                   .text(`${index + 1}. ${theme.name}`, 60, currentY + 8);
                
                doc.fontSize(10)
                   .fillColor('#6b7280')
                   .text(`${themeInfo.domain} Domain • Score: ${theme.score.toFixed(1)}`, 60, currentY + 23);
                
                currentY += 40;
                
                // Core Description with background
                doc.rect(50, currentY, 500, 15)
                   .fillColor('#eff6ff')
                   .fill();
                   
                doc.fontSize(10)
                   .fillColor('#1e40af')
                   .text('Core Description:', 60, currentY + 3, { underline: true });
                currentY += 20;
                
                doc.fontSize(10)
                   .fillColor('#374151')
                   .text(themeInfo.description, 60, currentY, { width: 480 });
                currentY = doc.y + 10;
                
                // Elaborate Description with subtle background
                doc.rect(50, currentY, 500, 15)
                   .fillColor('#f0fdf4')
                   .fill();
                   
                doc.fontSize(10)
                   .fillColor('#166534')
                   .text('Detailed Analysis:', 60, currentY + 3, { underline: true });
                currentY += 20;
                
                doc.fontSize(10)
                   .fillColor('#374151')
                   .text(themeInfo.elaborate_description, 60, currentY, { width: 480 });
                currentY = doc.y + 10;
                
                // Key Characteristics in a box
                doc.rect(50, currentY, 500, 15)
                   .fillColor('#fef3c7')
                   .fill();
                   
                doc.fontSize(10)
                   .fillColor('#92400e')
                   .text('Key Characteristics:', 60, currentY + 3, { underline: true });
                currentY += 20;
                
                themeInfo.core_characteristics.forEach(char => {
                    doc.fontSize(9)
                       .fillColor('#374151')
                       .text(`• ${char}`, 65, currentY, { width: 470 });
                    currentY = doc.y + 3;
                });
                
                currentY += 10;
                
                // Applications sections with colored backgrounds
                const applicationSections = [
                    { title: 'Personal Life Applications:', items: themeInfo.personal_life, color: '#fef2f2', textColor: '#991b1b' },
                    { title: 'Education Applications:', items: themeInfo.education, color: '#f0f9ff', textColor: '#1e40af' },
                    { title: 'Career Applications:', items: themeInfo.career, color: '#f0fdf4', textColor: '#166534' }
                ];
                
                applicationSections.forEach(section => {
                    // Check for page break before each section
                    if (currentY > 650) {
                        doc.addPage();
                        currentY = 50;
                    }
                    
                    // Section header with background
                    doc.rect(50, currentY, 500, 15)
                       .fillColor(section.color)
                       .fill();
                       
                    doc.fontSize(10)
                       .fillColor(section.textColor)
                       .text(section.title, 60, currentY + 3, { underline: true });
                    currentY += 20;
                    
                    section.items.forEach(item => {
                        if (currentY > 750) {
                            doc.addPage();
                            currentY = 50;
                        }
                        doc.fontSize(9)
                           .fillColor('#374151')
                           .text(`• ${item}`, 65, currentY, { width: 470 });
                        currentY = doc.y + 3;
                    });
                    
                    currentY += 10;
                });
                
                themeInfo.development_tips.forEach(tip => {
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                    }
                    doc.text(`• ${tip}`, 50, currentY, { width: 486 });
                    currentY = doc.y + 3;
                });
                
                currentY += 25;
            });
            
            // Enhanced Strength Combinations Analysis with Visuals
            doc.addPage();
            doc.fontSize(18)
               .fillColor('#1e293b')
               .text('Strength Combinations Analysis', 50, 50);
            
            currentY = 80;
            
            // Analyze top pairs from top 5
            processedData.top5Pairs.slice(0, 3).forEach((pair, index) => {
                const comboAnalysis = getDetailedComboAnalysis(pair.themeA.name, pair.themeB.name);
                
                if (currentY > 550) {
                    doc.addPage();
                    currentY = 50;
                }
                
                // Combination header with colored background
                doc.rect(50, currentY, 500, 25)
                   .fillColor('#f3f4f6')
                   .stroke('#9ca3af');
                
                doc.fontSize(12)
                   .fillColor('#1f2937')
                   .text(`${index + 1}. ${comboAnalysis.name}`, 60, currentY + 5);
                   
                doc.fontSize(10)
                   .fillColor('#6b7280')
                   .text(`${pair.themeA.name} + ${pair.themeB.name}`, 60, currentY + 17);
                
                currentY += 35;
                
                // Positive synergy section
                doc.rect(50, currentY, 500, 15)
                   .fillColor('#f0fdf4')
                   .fill();
                   
                doc.fontSize(10)
                   .fillColor('#166534')
                   .text('Positive Synergy:', 60, currentY + 3, { underline: true });
                currentY += 20;
                
                doc.fontSize(9)
                   .fillColor('#374151')
                   .text(comboAnalysis.positive_synergy, 60, currentY, { width: 480 });
                currentY = doc.y + 10;
                
                // Potential risks section
                doc.rect(50, currentY, 500, 15)
                   .fillColor('#fef2f2')
                   .fill();
                   
                doc.fontSize(10)
                   .fillColor('#991b1b')
                   .text('Potential Risks:', 60, currentY + 3, { underline: true });
                currentY += 20;
                
                doc.fontSize(9)
                   .fillColor('#374151')
                   .text(comboAnalysis.risks, 60, currentY, { width: 480 });
                currentY = doc.y + 15;
                
                currentY += 25;
            });
            
            // Add a final summary page
            doc.addPage();
            
            doc.fontSize(18)
               .fillColor('#1e293b')
               .text('Development Summary', 50, 50);
            
            // Summary box
            doc.rect(50, 90, 500, 200)
               .fillColor('#f8fafc')
               .stroke('#e2e8f0');
               
            doc.fontSize(12)
               .fillColor('#2563eb')
               .text('Key Takeaways for Your Development Journey:', 60, 110);
            
            const summaryPoints = [
                `Your primary strength domain is ${processedData.domainScores.primary_talent_domain}, which represents your greatest natural talent area.`,
                `Focus on developing your top 5 themes: ${processedData.top5.map(t => t.name).join(', ')}.`,
                `These strengths work best when applied in roles that require strategic thinking and innovation.`,
                `Consider how your unique combination of talents can create value in your personal and professional life.`,
                `Continue developing your strengths through intentional practice and application.`
            ];
            
            let summaryY = 140;
            summaryPoints.forEach(point => {
                doc.fontSize(10)
                   .fillColor('#374151')
                   .text(`• ${point}`, 65, summaryY, { width: 470 });
                summaryY = doc.y + 8;
            });
            
            // Enhanced Footer
            doc.fontSize(10)
               .fillColor('#9ca3af')
               .text('This report is generated by StrengthsFinder 360 Assessment Tool', 50, doc.page.height - 70, { align: 'center' });
               
            doc.fontSize(8)
               .fillColor('#6b7280')
               .text(`Generated on ${new Date().toLocaleDateString()} • Report ID: ${candidate.id}`, 50, doc.page.height - 50, { align: 'center' });
            
            // Finalize PDF
            doc.end();
            
        } catch (error) {
            console.error('Error generating comprehensive PDF:', error);
            reject(error);
        }
    });
}

module.exports = {
    processPsychometricData,
    getElaborateThemeDescription,
    getDetailedComboAnalysis,
    generateComprehensivePDF
};