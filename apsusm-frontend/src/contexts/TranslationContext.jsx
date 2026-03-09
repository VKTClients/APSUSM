import React, { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  en: {
    // Navigation
    nav_home: 'Home',
    nav_how_it_works: 'How it works',
    nav_register: 'Register',
    nav_admin: 'Admin',
    nav_apply: 'Apply for Membership',
    nav_mock_mode: 'Mock Mode',

    // Homepage — Hero
    hero_tag: 'Membership open for',
    hero_tag_suffix: 'health professionals',
    hero_title: 'Membership Portal',
    hero_subtitle: 'Join the Associação dos Profissionais de Saúde Unidos e Solidários de Moçambique. Register online, pay securely, and receive your verified digital membership card.',
    hero_cta_primary: 'Apply for Membership',
    hero_cta_secondary: 'How it works',

    // Homepage — Stats
    stats_members: 'Registered Members',
    stats_provinces: 'Provinces Covered',
    stats_secure: 'Secure Payments',
    stats_card: 'Card Generation',

    // Homepage — Features
    features_title: 'What you get',
    features_subtitle: 'Everything included in your membership',
    feature_card_title: 'Digital Membership Card',
    feature_card_desc: 'Receive a professionally designed digital card with your photo, unique ID, and QR verification code.',
    feature_verify_title: 'Secure Verification',
    feature_verify_desc: 'Every card carries a scannable QR code that instantly verifies your membership status online.',
    feature_payment_title: 'Paystack Payments',
    feature_payment_desc: 'Safe and fast payment processing through Paystack — supports mobile money and card payments.',
    feature_email_title: 'Email Confirmation',
    feature_email_desc: 'Get your membership card and payment receipt delivered directly to your inbox within 24 hours.',

    // Homepage — Mission
    mission_label: 'Our Mission',
    mission_title: 'Defending the Rights of Health Professionals',
    mission_body: 'The mission of APSUSM (Association of United and Solidarity Health Professionals of Mozambique) is to promote the appreciation and representation of health professionals. The association acts as an active defender of their interests and as a strategic partner in strengthening the health system, guaranteeing better working conditions and professional dignity.',
    mission_closing: 'In short, APSUSM seeks to be a strategic partner, but also a demanding defender of the rights and quality of life of Mozambican health professionals.',

    pillar_advocacy_title: 'Advocacy',
    pillar_advocacy_desc: 'To actively protect the rights of health professionals in Mozambique.',
    pillar_appreciation_title: 'Professional Appreciation',
    pillar_appreciation_desc: 'To promote the improvement of working conditions and the recognition of the role of health professionals.',
    pillar_representation_title: 'Representation',
    pillar_representation_desc: 'To function as a unified voice for the class, demanding improvements in the health sector.',
    pillar_solidarity_title: 'Solidarity',
    pillar_solidarity_desc: 'To foster unity among health workers.',

    // Homepage — Process
    process_title: 'Process',
    process_subtitle: 'How it works',
    process_1_title: 'Fill Registration Form',
    process_1_desc: 'Provide your personal details, institution, position, and upload a clear ID photo.',
    process_2_title: 'Complete Payment',
    process_2_desc: 'Pay the membership fee securely via Paystack. You\'ll be redirected back automatically.',
    process_3_title: 'Receive Your Card',
    process_3_desc: 'Your unique Member ID and digital membership card are generated instantly.',

    // Homepage — CTA
    cta_title: 'Join today',
    cta_subtitle: 'Ready to become a verified APSUSM member?',
    cta_button: 'Apply Now',
    cta_note: 'Fast process · Secure payment · Digital card',

    // Registration Page
    reg_badge: 'Membership Registration',
    reg_headline: 'Join the Standard.',
    reg_subheadline: 'Complete your registration to become a verified APSUSM member and receive your digital credential.',
    reg_step_details: 'Details',
    reg_step_review: 'Review',
    reg_step_payment: 'Payment',

    reg_full_name: 'Full Name',
    reg_full_name_placeholder: 'e.g. Natália Eduardo Chiau',
    reg_phone: 'Phone Number',
    reg_email: 'Email Address',
    reg_email_placeholder: 'you@example.com',
    reg_institution: 'Name of Institution',
    reg_institution_placeholder: 'e.g. Hospital Central de Maputo',
    reg_position: 'Position / Occupation',
    reg_position_placeholder: 'e.g. Nurse, Doctor, Pharmacist',
    reg_province: 'Province',
    reg_province_placeholder: 'Select province...',
    reg_photo: 'ID Photo (JPEG/PNG, max 5MB)',
    reg_photo_upload: 'Click to upload your ID photo',
    reg_photo_hint: 'Clear face photo, shoulders up',
    reg_photo_change: 'Click to change',

    reg_photo_mode_label: 'How should we use your photo?',
    reg_photo_mode_original: 'Use Original',
    reg_photo_mode_original_desc: 'Use your photo exactly as uploaded — no edits.',
    reg_photo_mode_enhanced: 'AI Enhanced',
    reg_photo_mode_enhanced_desc: 'Improve background & lighting while keeping your real face.',
    reg_photo_mode_review: 'Photo Mode',

    reg_terms_label: 'I accept the terms and conditions of APSUSM membership. I confirm that the information provided is accurate and I consent to its use for membership purposes.',

    reg_review_btn: 'Review Details',
    reg_review_title: 'Review Your Details',
    reg_edit_btn: 'Edit Details',
    reg_confirm_btn: 'Confirm Registration',
    reg_processing: 'Finalizing...',
    reg_payment_required: 'No Payment Required',
    reg_payment_desc: 'Registration is temporarily free for already-paid members. After confirming, we will finalize your registration and generate your card.',
    reg_redirecting: 'Finalizing Registration...',
    reg_redirecting_desc: 'Please wait while we save your details and prepare your membership card.',
    reg_go_back: 'Go back and try again',
    reg_privacy: 'Your data is end-to-end encrypted and strictly confidential.',

    reg_error_name: 'Full name is required',
    reg_error_phone: 'Phone number is required',
    reg_error_email: 'Email is required',
    reg_error_email_format: 'Invalid email format',
    reg_error_institution: 'Institution name is required',
    reg_error_position: 'Position / occupation is required',
    reg_error_province: 'Province is required',
    reg_error_photo: 'ID photo is required',
    reg_error_photo_type: 'Only JPEG and PNG images are allowed',
    reg_error_photo_size: 'File size must be under 5MB',
    reg_error_terms: 'You must accept the terms and conditions',
    reg_error_payment: 'Payment initialization failed',
    reg_error_failed: 'Registration failed. Please try again.',

    // Payment Verification
    verify_verifying: 'Verifying Payment...',
    verify_verifying_desc: 'Please wait while we confirm your payment with Paystack.',
    verify_success: 'Payment Verified!',
    verify_success_desc: 'Your membership card is being generated. Redirecting...',
    verify_failed: 'Payment Failed',
    verify_back: 'Back to Registration',

    // Success Page
    success_welcome: 'Welcome to APSUSM!',
    success_desc: 'Your membership has been confirmed. You are now a verified member.',
    success_member_id: 'Your Member ID',
    success_download_front: 'Download Front',
    success_download_back: 'Download Back',
    success_download_card: 'Download Card',
    success_generating: 'Generating your membership card...',
    success_generating_desc: 'This page will update automatically.',
    success_email_sent: 'A confirmation email with your digital card has been sent to',
    success_your_card: 'Your Membership Card',

    // Verification Page
    verify_title: 'Membership Verification',
    verify_verified: 'Verified Member',
    verify_valid: 'This is a valid APSUSM credential',
    verify_not_found: 'Not Found',
    verify_not_found_desc: 'This member ID could not be verified',

    // Admin
    admin_title: 'Admin Portal',
    admin_subtitle: 'APSUSM Membership Management',
    admin_header: 'APSUSM Admin',
    admin_username: 'Username',
    admin_password: 'Password',
    admin_sign_in: 'Sign In',
    admin_invalid: 'Invalid credentials',
    admin_logout: 'Logout',
    admin_refresh: 'Refresh',
    admin_no_members: 'No members found',

    admin_stats_total: 'Total Members',
    admin_stats_pending: 'Pending Payment',
    admin_stats_paid: 'Paid',
    admin_stats_active: 'Active',
    admin_stats_cards: 'Cards Generated',
    admin_stats_failed: 'Payment Failed',

    admin_members: 'Members',
    admin_search_placeholder: 'Search name, email, ID...',
    admin_filter_all: 'All Statuses',
    admin_filter_pending: 'Pending Payment',
    admin_filter_paid: 'Paid',
    admin_filter_card: 'Card Generated',
    admin_filter_active: 'Active',
    admin_filter_failed: 'Payment Failed',

    admin_col_member: 'Member',
    admin_col_member_id: 'Member ID',
    admin_col_province: 'Province',
    admin_col_status: 'Status',
    admin_col_registered: 'Registered',
    admin_col_actions: 'Actions',
    admin_detail_title: 'Member Details',
    admin_card_preview: 'Card Preview',
    admin_regenerate: 'Regenerate Card',
    admin_download_front: 'Front',
    admin_download_back: 'Back',

    // Navigation — Donate
    nav_donate: 'Donate',

    // Donations Page
    donate_badge: 'Support Our Mission',
    donate_headline: 'Help Us Empower Health Professionals',
    donate_subtitle: 'Your contribution directly supports advocacy, training, and better working conditions for health professionals across Mozambique.',

    donate_impact_label: 'Your Impact',
    donate_impact_title: 'Where Your Donation Goes',
    donate_impact_equipment_title: 'Medical Equipment',
    donate_impact_equipment_desc: 'Help provide essential medical supplies and equipment to underserved health facilities.',
    donate_impact_training_title: 'Professional Training',
    donate_impact_training_desc: 'Fund workshops, seminars, and continuing education programs for health workers.',
    donate_impact_community_title: 'Community Outreach',
    donate_impact_community_desc: 'Support health campaigns and community awareness programs in rural areas.',
    donate_impact_advocacy_title: 'Rights Advocacy',
    donate_impact_advocacy_desc: 'Strengthen legal and policy advocacy for better working conditions and fair wages.',

    donate_amount_label: 'Make a Donation',
    donate_amount_title: 'Choose an Amount',
    donate_tier_supporter: 'Supporter',
    donate_tier_champion: 'Champion',
    donate_tier_patron: 'Patron',
    donate_tier_benefactor: 'Benefactor',
    donate_custom_amount: 'Or enter a custom amount',
    donate_cta_button: 'Donate Now',
    donate_cta_note: 'Secure payment · Tax deductible · Every amount helps',

    donate_bank_label: 'Bank Transfer',
    donate_bank_title: 'Transfer Directly',
    donate_bank_name: 'Account Name',
    donate_bank_bank: 'Bank',
    donate_bank_account: 'Account Number',
    donate_bank_nib: 'NIB',
    donate_bank_reference: 'Please include your name or email as the transfer reference so we can acknowledge your donation.',

    donate_trust_title: 'Transparent & Accountable',
    donate_trust_desc: 'APSUSM publishes annual financial reports. Every donation is tracked and allocated to our core mission areas.',

    donate_bottom_cta_label: 'Become a member',
    donate_bottom_cta_title: 'Want to do more? Join APSUSM as a member.',
    donate_bottom_cta_button: 'Apply for Membership',
    donate_bottom_cta_note: 'Members receive a verified digital card',

    // Footer
    footer_copyright: 'Associação dos Profissionais de Saúde Unidos e Solidários de Moçambique.',
  },

  pt: {
    // Navigation
    nav_home: 'Início',
    nav_how_it_works: 'Como funciona',
    nav_register: 'Registrar',
    nav_admin: 'Admin',
    nav_apply: 'Inscrever-se',
    nav_mock_mode: 'Modo Teste',

    // Homepage — Hero
    hero_tag: 'Associação aberta para',
    hero_tag_suffix: 'profissionais de saúde',
    hero_title: 'Portal de Filiação',
    hero_subtitle: 'Junte-se à Associação dos Profissionais de Saúde Unidos e Solidários de Moçambique. Registre-se online, pague com segurança e receba seu cartão de filiação digital verificado.',
    hero_cta_primary: 'Inscrever-se',
    hero_cta_secondary: 'Como funciona',

    // Homepage — Stats
    stats_members: 'Membros Registrados',
    stats_provinces: 'Províncias Cobertas',
    stats_secure: 'Pagamentos Seguros',
    stats_card: 'Geração de Cartão',

    // Homepage — Features
    features_title: 'O que você recebe',
    features_subtitle: 'Tudo incluído na sua filiação',
    feature_card_title: 'Cartão de Filiação Digital',
    feature_card_desc: 'Receba um cartão digital profissionalmente projetado com sua foto, ID exclusivo e código QR de verificação.',
    feature_verify_title: 'Verificação Segura',
    feature_verify_desc: 'Cada cartão possui um código QR escaneável que verifica instantaneamente seu status de filiação online.',
    feature_payment_title: 'Pagamentos Paystack',
    feature_payment_desc: 'Processamento de pagamento rápido e seguro através do Paystack — suporta dinheiro móvel e pagamentos com cartão.',
    feature_email_title: 'Confirmação por Email',
    feature_email_desc: 'Receba seu cartão de filiação e comprovante de pagamento diretamente na sua caixa de entrada em até 24 horas.',

    // Homepage — Mission
    mission_label: 'Nossa Missão',
    mission_title: 'Defesa dos Direitos dos Profissionais de Saúde',
    mission_body: 'A missão da APSUSM (Associação dos Profissionais de Saúde Unidos e Solidários de Moçambique) é promover a valorização e representação dos profissionais de saúde. A associação atua como defensora ativa dos seus interesses e como parceira estratégica no fortalecimento do sistema de saúde, garantindo melhores condições de trabalho e dignidade profissional.',
    mission_closing: 'Em resumo, a APSUSM procura ser uma parceira estratégica, mas também uma defensora exigente dos direitos e da qualidade de vida dos profissionais de saúde moçambicanos.',

    pillar_advocacy_title: 'Advocacia',
    pillar_advocacy_desc: 'Proteger ativamente os direitos dos profissionais de saúde em Moçambique.',
    pillar_appreciation_title: 'Valorização Profissional',
    pillar_appreciation_desc: 'Promover a melhoria das condições de trabalho e o reconhecimento do papel dos profissionais de saúde.',
    pillar_representation_title: 'Representação',
    pillar_representation_desc: 'Funcionar como voz unificada da classe, exigindo melhorias no setor da saúde.',
    pillar_solidarity_title: 'Solidariedade',
    pillar_solidarity_desc: 'Promover a união entre os trabalhadores de saúde.',

    // Homepage — Process
    process_title: 'Processo',
    process_subtitle: 'Como funciona',
    process_1_title: 'Preencher Formulário',
    process_1_desc: 'Forneça seus dados pessoais, instituição, cargo e carregue uma foto de identificação clara.',
    process_2_title: 'Completar Pagamento',
    process_2_desc: 'Pague a taxa de filiação com segurança através do Paystack. Você será redirecionado automaticamente.',
    process_3_title: 'Receber seu Cartão',
    process_3_desc: 'Seu ID de Membro exclusivo e cartão de filiação digital são gerados instantaneamente.',

    // Homepage — CTA
    cta_title: 'Junte-se hoje',
    cta_subtitle: 'Pronto para se tornar um membro verificado da APSUSM?',
    cta_button: 'Inscrever-se Agora',
    cta_note: 'Processo rápido · Pagamento seguro · Cartão digital',

    // Registration Page
    reg_badge: 'Registro de Filiação',
    reg_headline: 'Junte-se ao Padrão.',
    reg_subheadline: 'Complete seu registro para se tornar um membro verificado da APSUSM e receber sua credencial digital.',
    reg_step_details: 'Dados',
    reg_step_review: 'Revisão',
    reg_step_payment: 'Pagamento',

    reg_full_name: 'Nome Completo',
    reg_full_name_placeholder: 'ex. Natália Eduardo Chiau',
    reg_phone: 'Número de Telefone',
    reg_email: 'Endereço de Email',
    reg_email_placeholder: 'voce@exemplo.com',
    reg_institution: 'Nome da Instituição',
    reg_institution_placeholder: 'ex. Hospital Central de Maputo',
    reg_position: 'Cargo / Ocupação',
    reg_position_placeholder: 'ex. Enfermeiro(a), Médico(a), Farmacêutico(a)',
    reg_province: 'Província',
    reg_province_placeholder: 'Selecione a província...',
    reg_photo: 'Foto de Identificação (JPEG/PNG, máx 5MB)',
    reg_photo_upload: 'Clique para carregar sua foto de identificação',
    reg_photo_hint: 'Foto clara do rosto, dos ombros para cima',
    reg_photo_change: 'Clique para alterar',

    reg_photo_mode_label: 'Como devemos usar a sua foto?',
    reg_photo_mode_original: 'Usar Original',
    reg_photo_mode_original_desc: 'Usar a sua foto exatamente como foi carregada — sem edições.',
    reg_photo_mode_enhanced: 'Melhorada por IA',
    reg_photo_mode_enhanced_desc: 'Melhorar fundo e iluminação mantendo o seu rosto real.',
    reg_photo_mode_review: 'Modo de Foto',

    reg_terms_label: 'Aceito os termos e condições de filiação da APSUSM. Confirmo que as informações fornecidas são precisas e consinto com seu uso para fins de filiação.',

    reg_review_btn: 'Revisar Dados',
    reg_review_title: 'Revise Seus Dados',
    reg_edit_btn: 'Editar Dados',
    reg_confirm_btn: 'Confirmar Registo',
    reg_processing: 'A concluir...',
    reg_payment_required: 'Sem Pagamento Necessário',
    reg_payment_desc: 'O registo está temporariamente gratuito para membros já pagos. Após confirmar, vamos concluir o seu registo e gerar o seu cartão.',
    reg_redirecting: 'A concluir o registo...',
    reg_redirecting_desc: 'Aguarde enquanto guardamos os seus dados e preparamos o seu cartão de membro.',
    reg_go_back: 'Voltar e tentar novamente',
    reg_privacy: 'Seus dados são criptografados de ponta a ponta e estritamente confidenciais.',

    reg_error_name: 'Nome completo é obrigatório',
    reg_error_phone: 'Número de telefone é obrigatório',
    reg_error_email: 'Email é obrigatório',
    reg_error_email_format: 'Formato de email inválido',
    reg_error_institution: 'Nome da instituição é obrigatório',
    reg_error_position: 'Cargo / ocupação é obrigatório',
    reg_error_province: 'Província é obrigatória',
    reg_error_photo: 'Foto de identificação é obrigatória',
    reg_error_photo_type: 'Apenas imagens JPEG e PNG são permitidas',
    reg_error_photo_size: 'O arquivo deve ter menos de 5MB',
    reg_error_terms: 'Você deve aceitar os termos e condições',
    reg_error_payment: 'Falha na inicialização do pagamento',
    reg_error_failed: 'Registro falhou. Por favor, tente novamente.',

    // Payment Verification
    verify_verifying: 'Verificando Pagamento...',
    verify_verifying_desc: 'Aguarde enquanto confirmamos seu pagamento com o Paystack.',
    verify_success: 'Pagamento Verificado!',
    verify_success_desc: 'Seu cartão de filiação está sendo gerado. Redirecionando...',
    verify_failed: 'Pagamento Falhou',
    verify_back: 'Voltar ao Registro',

    // Success Page
    success_welcome: 'Bem-vindo à APSUSM!',
    success_desc: 'Sua filiação foi confirmada. Você agora é um membro verificado.',
    success_member_id: 'Seu ID de Membro',
    success_download_front: 'Baixar Frente',
    success_download_back: 'Baixar Verso',
    success_download_card: 'Baixar Cartão',
    success_generating: 'Gerando seu cartão de filiação...',
    success_generating_desc: 'Esta página será atualizada automaticamente.',
    success_email_sent: 'Um email de confirmação com seu cartão digital foi enviado para',
    success_your_card: 'Seu Cartão de Filiação',

    // Verification Page
    verify_title: 'Verificação de Filiação',
    verify_verified: 'Membro Verificado',
    verify_valid: 'Esta é uma credencial APSUSM válida',
    verify_not_found: 'Não Encontrado',
    verify_not_found_desc: 'Este ID de membro não pôde ser verificado',

    // Admin
    admin_title: 'Portal Admin',
    admin_subtitle: 'Gestão de Filiação APSUSM',
    admin_header: 'APSUSM Admin',
    admin_username: 'Nome de Usuário',
    admin_password: 'Senha',
    admin_sign_in: 'Entrar',
    admin_invalid: 'Credenciais inválidas',
    admin_logout: 'Sair',
    admin_refresh: 'Atualizar',
    admin_no_members: 'Nenhum membro encontrado',

    admin_stats_total: 'Total de Membros',
    admin_stats_pending: 'Pagamento Pendente',
    admin_stats_paid: 'Pago',
    admin_stats_active: 'Ativo',
    admin_stats_cards: 'Cartões Gerados',
    admin_stats_failed: 'Pagamento Falhou',

    admin_members: 'Membros',
    admin_search_placeholder: 'Buscar nome, email, ID...',
    admin_filter_all: 'Todos os Status',
    admin_filter_pending: 'Pagamento Pendente',
    admin_filter_paid: 'Pago',
    admin_filter_card: 'Cartão Gerado',
    admin_filter_active: 'Ativo',
    admin_filter_failed: 'Pagamento Falhou',

    admin_col_member: 'Membro',
    admin_col_member_id: 'ID de Membro',
    admin_col_province: 'Província',
    admin_col_status: 'Status',
    admin_col_registered: 'Registrado',
    admin_col_actions: 'Ações',
    admin_detail_title: 'Detalhes do Membro',
    admin_card_preview: 'Visualização do Cartão',
    admin_regenerate: 'Regenerar Cartão',
    admin_download_front: 'Frente',
    admin_download_back: 'Verso',

    // Navigation — Donate
    nav_donate: 'Doar',

    // Donations Page
    donate_badge: 'Apoie a Nossa Missão',
    donate_headline: 'Ajude-nos a Capacitar os Profissionais de Saúde',
    donate_subtitle: 'A sua contribuição apoia diretamente a advocacia, formação e melhores condições de trabalho para os profissionais de saúde em todo Moçambique.',

    donate_impact_label: 'O Seu Impacto',
    donate_impact_title: 'Para Onde Vai a Sua Doação',
    donate_impact_equipment_title: 'Equipamento Médico',
    donate_impact_equipment_desc: 'Ajude a fornecer suprimentos e equipamentos médicos essenciais a unidades de saúde carenciadas.',
    donate_impact_training_title: 'Formação Profissional',
    donate_impact_training_desc: 'Financie workshops, seminários e programas de educação contínua para profissionais de saúde.',
    donate_impact_community_title: 'Alcance Comunitário',
    donate_impact_community_desc: 'Apoie campanhas de saúde e programas de sensibilização comunitária em áreas rurais.',
    donate_impact_advocacy_title: 'Advocacia de Direitos',
    donate_impact_advocacy_desc: 'Fortaleça a advocacia legal e política para melhores condições de trabalho e salários justos.',

    donate_amount_label: 'Faça uma Doação',
    donate_amount_title: 'Escolha um Valor',
    donate_tier_supporter: 'Apoiador',
    donate_tier_champion: 'Campeão',
    donate_tier_patron: 'Patrono',
    donate_tier_benefactor: 'Benfeitor',
    donate_custom_amount: 'Ou insira um valor personalizado',
    donate_cta_button: 'Doar Agora',
    donate_cta_note: 'Pagamento seguro · Dedutível de impostos · Cada valor ajuda',

    donate_bank_label: 'Transferência Bancária',
    donate_bank_title: 'Transferir Diretamente',
    donate_bank_name: 'Nome da Conta',
    donate_bank_bank: 'Banco',
    donate_bank_account: 'Número da Conta',
    donate_bank_nib: 'NIB',
    donate_bank_reference: 'Por favor inclua o seu nome ou email como referência da transferência para que possamos reconhecer a sua doação.',

    donate_trust_title: 'Transparente e Responsável',
    donate_trust_desc: 'A APSUSM publica relatórios financeiros anuais. Cada doação é rastreada e alocada às nossas áreas de missão.',

    donate_bottom_cta_label: 'Torne-se membro',
    donate_bottom_cta_title: 'Quer fazer mais? Junte-se à APSUSM como membro.',
    donate_bottom_cta_button: 'Inscrever-se',
    donate_bottom_cta_note: 'Membros recebem um cartão digital verificado',

    // Footer
    footer_copyright: 'Associação dos Profissionais de Saúde Unidos e Solidários de Moçambique.',
  }
}

const TranslationContext = createContext()

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('apsusm_language')
    return saved || 'en' // Default to English
  })

  useEffect(() => {
    localStorage.setItem('apsusm_language', language)
    document.documentElement.lang = language
  }, [language])

  const t = (key) => {
    return translations[language][key] || key
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'pt' : 'en')
  }

  return (
    <TranslationContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }
  return context
}
