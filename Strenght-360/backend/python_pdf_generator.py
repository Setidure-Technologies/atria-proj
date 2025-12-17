#!/usr/bin/env python3
"""
PDF Generator Service for StrengthsFinder 360
This service receives JSON data and generates comprehensive PDF reports using the advanced logic.
"""

import sys
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def process_psychometric_data(webhook_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process psychometric test data from webhook and prepare for AI report generation
    """
    
    # 1) Extract the main data object - handle different possible structures
    body = None
    data = None
    
    if webhook_data.get('body') and webhook_data['body'].get('data'):
        # Structure: { body: { data: {...} } }
        body = webhook_data['body']
        data = webhook_data['body']['data']
    elif webhook_data.get('data'):
        # Structure: { data: {...} }
        body = webhook_data
        data = webhook_data['data']
    else:
        # Fallback: use the entire object as data
        body = webhook_data
        data = webhook_data
    
    # Validate that we have the essential data
    if not data:
        raise ValueError('No assessment data found in webhook payload')
    
    if not data.get('student_name') or not data.get('student_email'):
        raise ValueError('Missing student information (name or email) in the data')
    
    # 2) Candidate information
    candidate = {
        'id': data.get('id', 'Unknown'),
        'name': data['student_name'],
        'email': data['student_email'],
        'created_at': data.get('created_at', datetime.now().isoformat())
    }
    
    # 3) Domain scores with proper fallbacks
    detailed_scores = data.get('detailed_scores', {})
    domain_scores = {
        'executing': float(detailed_scores.get('executing', data.get('executing_score', 0))),
        'influencing': float(detailed_scores.get('influencing', data.get('influencing_score', 0))),
        'relationship_building': float(detailed_scores.get('relationshipBuilding', data.get('relationship_building_score', 0))),
        'strategic_thinking': float(detailed_scores.get('strategicThinking', data.get('strategic_thinking_score', 0))),
        'primary_talent_domain': data.get('primary_talent_domain', 'Not Specified')
    }
    
    # 4) Process subdomain/strength scores
    subdomains = detailed_scores.get('subdomains', {})
    
    # If no subdomains found, create a fallback structure
    if not subdomains:
        print('Warning: No subdomain scores found. Using domain scores as fallback.')
        # Create basic theme structure from domain scores
        subdomains = {
            'Analytical': domain_scores['strategic_thinking'] * 0.8,
            'Relator': domain_scores['relationship_building'] * 0.8,
            'Communication': domain_scores['influencing'] * 0.8,
            'Achiever': domain_scores['executing'] * 0.8,
            'Ideation': domain_scores['strategic_thinking'] * 0.7,
            'Harmony': domain_scores['relationship_building'] * 0.7
        }
    
    # Theme → Domain mapping (CliftonStrengths style)
    domain_map = {
        # Executing Domain
        'Achiever': "Executing",
        'Arranger': "Executing", 
        'Belief': "Executing",
        'Consistency': "Executing",
        'Deliberative': "Executing",
        'Discipline': "Executing",
        'Focus': "Executing",
        'Responsibility': "Executing",
        'Restorative': "Executing",

        # Influencing Domain
        'Activator': "Influencing",
        'Command': "Influencing",
        'Communication': "Influencing",
        'Competition': "Influencing",
        'Maximizer': "Influencing",
        'SelfAssurance': "Influencing",
        'Significance': "Influencing",
        'Woo': "Influencing",

        # Relationship Building Domain
        'Adaptability': "Relationship Building",
        'Connectedness': "Relationship Building",
        'Developer': "Relationship Building",
        'Empathy': "Relationship Building",
        'Harmony': "Relationship Building",
        'Includer': "Relationship Building",
        'Individualization': "Relationship Building",
        'Positivity': "Relationship Building",
        'Relator': "Relationship Building",

        # Strategic Thinking Domain
        'Analytical': "Strategic Thinking",
        'Context': "Strategic Thinking",
        'Futuristic': "Strategic Thinking",
        'Ideation': "Strategic Thinking",
        'Input': "Strategic Thinking",
        'Intellection': "Strategic Thinking",
        'Learner': "Strategic Thinking",
        'Strategic': "Strategic Thinking",
    }
    
    # Build strength scores from subdomains
    strength_scores = {}
    for name, raw_score in subdomains.items():
        strength_scores[name] = float(raw_score) if raw_score is not None else 0.0
    
    # 5) Build complete theme list with domains
    all_themes = []
    for name, score in strength_scores.items():
        all_themes.append({
            'name': name,
            'score': score,
            'domain': domain_map.get(name, "Unknown")
        })
    
    # Sort by score DESC, then name ASC for consistent ordering
    all_themes.sort(key=lambda x: (-x['score'], x['name']))
    
    # 6) Get Top 5 themes
    top5 = all_themes[:5]
    
    # 7) Create all possible pairs from Top 5 for combination analysis
    top5_pairs = []
    for i in range(len(top5)):
        for j in range(i + 1, len(top5)):
            top5_pairs.append({
                'themeA': top5[i],
                'themeB': top5[j],
                'pairLabel': f"{top5[i]['name']} + {top5[j]['name']}"
            })
    
    # 8) Prepare final structured output for AI nodes
    processed_data = {
        'candidate': candidate,
        'domainScores': domain_scores,
        'strength_scores': strength_scores,
        'allThemes': all_themes,
        'top5': top5,
        'top5Pairs': top5_pairs,
        'responses': data.get('responses'),
        'raw': body  # Keep original for reference
    }
    
    return processed_data

def get_elaborate_theme_description(theme_name: str) -> Dict[str, Any]:
    """Get comprehensive description for each strength theme"""
    theme_data = {
        'Ideation': {
            'description': 'You are fascinated by ideas and enjoy making connections between seemingly disparate phenomena.',
            'elaborate_description': 'Your Ideation strength means you are naturally curious and imaginative. You see the world as a place full of possibilities and connections that others might miss.',
            'domain': 'Strategic Thinking',
            'core_characteristics': [
                'Natural curiosity and imagination',
                'Ability to see patterns and connections',
                'Comfort with abstract thinking',
                'Enjoyment of brainstorming and idea generation',
                'Innovative problem-solving approach'
            ]
        },
        'Analytical': {
            'description': 'You search for reasons and causes and think about all the factors that might affect a situation.',
            'elaborate_description': 'Your Analytical strength means you have a natural tendency to examine information carefully and systematically.',
            'domain': 'Strategic Thinking',
            'core_characteristics': [
                'Systematic and methodical thinking',
                'Strong critical thinking skills',
                'Data-driven decision making',
                'Attention to detail and accuracy',
                'Logical reasoning ability'
            ]
        },
        'Harmony': {
            'description': 'You look for consensus and areas of agreement, avoiding conflict whenever possible.',
            'elaborate_description': 'Your Harmony strength means you have a natural ability to sense and create agreement among people.',
            'domain': 'Relationship Building',
            'core_characteristics': [
                'Conflict avoidance and resolution skills',
                'Empathy and understanding of others perspectives',
                'Ability to find common ground',
                'Preference for cooperative environments',
                'Strong listening and communication skills'
            ]
        },
        'Communication': {
            'description': 'You generally find it easy to put your thoughts into words and are good conversationalists and presenters.',
            'elaborate_description': 'Your Communication strength means you have a natural ability to express ideas clearly and persuasively.',
            'domain': 'Influencing',
            'core_characteristics': [
                'Clear and effective verbal communication',
                'Ability to engage and captivate audiences',
                'Strong storytelling abilities',
                'Comfort with public speaking',
                'Skill in making complex ideas accessible'
            ]
        },
        'Achiever': {
            'description': 'You work hard and possess great stamina. You take immense satisfaction in being busy and productive.',
            'elaborate_description': 'Your Achiever strength means you have a constant need for achievement and feel most satisfied when accomplishing tasks.',
            'domain': 'Executing',
            'core_characteristics': [
                'Strong work ethic and drive',
                'Need for constant productivity',
                'Satisfaction from completing tasks',
                'High energy and stamina',
                'Goal-oriented mindset'
            ]
        },
        'Relator': {
            'description': 'You enjoy close relationships with others and find deep satisfaction in working hard with friends to achieve a goal.',
            'elaborate_description': 'Your Relator strength means you are drawn to people you already know and enjoy building deeper relationships.',
            'domain': 'Relationship Building',
            'core_characteristics': [
                'Preference for deep relationships',
                'Loyalty and trust-building',
                'Enjoyment of working with known people',
                'Authentic connection abilities',
                'Long-term relationship focus'
            ]
        }
    }
    
    # Return default structure if theme not found
    default_structure = {
        'description': f'This {theme_name} strength represents a unique talent that influences your thinking and behavior.',
        'elaborate_description': f'Your {theme_name} strength contributes to your unique approach to challenges and opportunities.',
        'domain': 'Unknown',
        'core_characteristics': [
            f'Natural talent in {theme_name}',
            'Unique perspective and approach',
            'Distinctive thinking pattern',
            'Specific behavioral strengths'
        ]
    }
    
    return theme_data.get(theme_name, default_structure)

def generate_comprehensive_pdf(processed_data: Dict[str, Any], output_filename: str) -> str:
    """
    Generate a comprehensive PDF report using advanced ReportLab features
    """
    
    # Create the document
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=A4,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )
    
    # Get default styles and create custom ones
    styles = getSampleStyleSheet()
    
    # Custom styles with professional appearance
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        spaceAfter=30,
        alignment=1,  # Center alignment
        textColor=colors.HexColor('#2E86AB'),
        fontName='Helvetica-Bold'
    )
    
    heading1_style = ParagraphStyle(
        'CustomHeading1',
        parent=styles['Heading1'],
        fontSize=14,
        spaceAfter=12,
        textColor=colors.HexColor('#2E86AB'),
        fontName='Helvetica-Bold'
    )
    
    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=6,
        textColor=colors.HexColor('#1B4F72'),
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
        textColor=colors.black,
        alignment=0  # Left alignment
    )
    
    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=3,
        leftIndent=20,
        textColor=colors.black
    )
    
    # Story to hold all elements
    story = []
    
    # 1. Cover Page
    story.append(Paragraph("COMPREHENSIVE STRENGTHS ASSESSMENT REPORT", title_style))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("Detailed Analysis of Your Natural Talents and Potential", styles['Heading2']))
    story.append(Spacer(1, 0.5*inch))
    
    candidate = processed_data['candidate']
    story.append(Paragraph(f"<b>Prepared for:</b> {candidate['name']}", normal_style))
    story.append(Paragraph(f"<b>Email:</b> {candidate['email']}", normal_style))
    story.append(Paragraph(f"<b>Assessment Date:</b> {candidate['created_at'][:10]}", normal_style))
    story.append(Paragraph(f"<b>Primary Talent Domain:</b> {processed_data['domainScores']['primary_talent_domain']}", normal_style))
    story.append(Paragraph(f"<b>Report ID:</b> {candidate['id']}", normal_style))
    
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(
        "This comprehensive report provides detailed insights into your unique strengths pattern, "
        "practical applications, and development strategies for personal and professional growth.",
        normal_style
    ))
    
    story.append(PageBreak())
    
    # 2. Executive Summary
    story.append(Paragraph("Executive Summary", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph(
        f"This StrengthsFinder 360 assessment reveals that {candidate['name']} demonstrates a distinctive "
        f"talent pattern with primary strength in {processed_data['domainScores']['primary_talent_domain']}. "
        "Your unique combination of strengths suggests particular aptitudes for strategic thinking, "
        "innovation, and complex problem-solving.",
        normal_style
    ))
    
    # Domain Scores Table
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("Domain Scores Overview", heading2_style))
    
    domain_data = [
        ['Talent Domain', 'Score', 'Level'],
        ['Strategic Thinking', f"{processed_data['domainScores']['strategic_thinking']:.1f}", 'High'],
        ['Relationship Building', f"{processed_data['domainScores']['relationship_building']:.1f}", 'Moderate'],
        ['Influencing', f"{processed_data['domainScores']['influencing']:.1f}", 'Developing'],
        ['Executing', f"{processed_data['domainScores']['executing']:.1f}", 'Foundation']
    ]
    
    domain_table = Table(domain_data, colWidths=[2.5*inch, 1*inch, 1.5*inch])
    domain_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E86AB')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
    ]))
    
    story.append(domain_table)
    story.append(PageBreak())
    
    # 3. Top 5 Strengths Analysis
    story.append(Paragraph("Your Top 5 Signature Strengths", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph(
        "Your signature strengths represent your most dominant natural talents. "
        "Understanding these strengths provides the foundation for maximizing your potential.",
        normal_style
    ))
    
    for i, theme in enumerate(processed_data['top5'], 1):
        theme_name = theme['name']
        theme_info = get_elaborate_theme_description(theme_name)
        
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(
            f"Strength {i}: {theme_name} ({theme_info['domain']} - Score: {theme['score']:.1f})", 
            heading1_style
        ))
        
        # Core Description
        story.append(Paragraph("<b>Description:</b>", heading2_style))
        story.append(Paragraph(theme_info['description'], normal_style))
        
        # Elaborate Description
        story.append(Paragraph("<b>Detailed Analysis:</b>", heading2_style))
        story.append(Paragraph(theme_info['elaborate_description'], normal_style))
        
        # Core Characteristics
        story.append(Paragraph("<b>Key Characteristics:</b>", heading2_style))
        for characteristic in theme_info['core_characteristics']:
            story.append(Paragraph(f"• {characteristic}", bullet_style))
        
        if i < len(processed_data['top5']):
            story.append(Spacer(1, 0.3*inch))
        
        # Add page break after every 2 strengths for better readability
        if i % 2 == 0 and i < len(processed_data['top5']):
            story.append(PageBreak())
    
    # 4. Development Recommendations
    story.append(PageBreak())
    story.append(Paragraph("Development Recommendations", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph(
        "Based on your unique strengths pattern, here are specific recommendations for personal "
        "and professional development:",
        normal_style
    ))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("<b>Leverage Your Strengths:</b>", heading2_style))
    story.append(Paragraph(
        f"Your dominant {processed_data['domainScores']['primary_talent_domain']} talents should be "
        "the foundation of your development strategy. Focus on roles and activities that allow you "
        "to use these natural abilities.",
        normal_style
    ))
    
    story.append(Paragraph("<b>Build Supporting Skills:</b>", heading2_style))
    story.append(Paragraph(
        "Develop complementary skills that support your primary strengths. This creates a more "
        "complete and effective talent profile.",
        normal_style
    ))
    
    story.append(Paragraph("<b>Team Collaboration:</b>", heading2_style))
    story.append(Paragraph(
        "Partner with individuals whose strengths complement yours. This creates powerful "
        "synergies and covers potential blind spots.",
        normal_style
    ))
    
    # 5. Footer Information
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph(
        "This report was generated by the StrengthsFinder 360 Assessment Tool. "
        "For questions about your results, please contact your assessment administrator.",
        ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=1  # Center alignment
        )
    ))
    
    # Build PDF
    doc.build(story)
    return output_filename

def main():
    """Main function to process JSON input and generate PDF"""
    try:
        # Read JSON data from stdin or from file argument
        if len(sys.argv) > 1:
            # Read from file
            with open(sys.argv[1], 'r', encoding='utf-8') as f:
                webhook_data = json.load(f)
            output_file = sys.argv[2] if len(sys.argv) > 2 else "strength_report.pdf"
        else:
            # Read from stdin
            webhook_data = json.load(sys.stdin)
            output_file = "strength_report.pdf"
        
        # Process the data
        processed_data = process_psychometric_data(webhook_data)
        
        # Generate PDF
        pdf_path = generate_comprehensive_pdf(processed_data, output_file)
        
        # Return success response
        response = {
            "success": True,
            "filePath": os.path.abspath(pdf_path),
            "fileName": os.path.basename(pdf_path),
            "candidate": processed_data['candidate']
        }
        
        print(json.dumps(response))
        return 0
        
    except Exception as e:
        # Return error response
        error_response = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_response))
        return 1

if __name__ == "__main__":
    sys.exit(main())