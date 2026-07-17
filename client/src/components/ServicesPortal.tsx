import React, { useState } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { 
  Building2, 
  FolderHeart, 
  RefreshCw, 
  GitPullRequest, 
  ShieldAlert, 
  Upload, 
  Check, 
  AlertCircle,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
  User,
  CheckCircle2
} from 'lucide-react';
import type { ServiceType } from '../types';

interface ServiceOption {
  id: ServiceType;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const POST_INC_SUB_SERVICES = [
  "Alterations of memo",
  "Change of Director",
  "Change of secretary",
  "Change of company name",
  "Change of register address",
  "Company search",
  "Certified true copy",
  "Increase in issue share capital",
  "Notice of change in particular if director/ shareholders",
  "Transfer of shares/ surrender/ new allotment",
  "Request of letter of good standing",
  "Liquidation"
];

const COMPLIANCE_SUB_SERVICES = [
  "Pencom",
  "ITF",
  "NSITF",
  "TCC",
  "BPP",
  "SCUML"
];

const OTHER_SUB_SERVICES = [
  "Export licence",
  "Mining licence",
  "NAFDAC",
  "SON",
  "NEWS PAPER PUBLICATIONS",
  "Driver's Licence",
  "Car Dealer's Licence"
];

const NIGERIA_STATES_AND_LGAS: Record<string, string[]> = {
  "Abia": ["Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umunneochi"],
  "Adamawa": ["Demsa", "Fufure", "Ganye", "Gayuk", "Gombi", "Girei", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"],
  "Akwa Ibom": ["Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot-Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"],
  "Anambra": ["Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"],
  "Bauchi": ["Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balewa", "Toro", "Warji", "Zaki"],
  "Bayelsa": ["Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"],
  "Benue": ["Agatu", "Apa", "Ado", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Oturkpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"],
  "Borno": ["Askira/Uba", "Bama", "Biu", "Chibok", "Damboa", "Dikwa", "Gwoza", "Hawul", "Jere", "Kaga", "Konduga", "Maiduguri", "Marte", "Monguno", "Ngala", "Shani"],
  "Cross River": ["Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki", "Calabar Municipal", "Calabar South", "Ikom", "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala"],
  "Delta": ["Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"],
  "Ebonyi": ["Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"],
  "Edo": ["Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben", "Ikpoba Okha", "Orhionmwon", "Oredo", "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde"],
  "Ekiti": ["Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure", "Gbonyin", "Ido Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"],
  "Enugu": ["Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo-Uwani"],
  "FCT (Abuja)": ["Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council (AMAC)"],
  "Gombe": ["Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"],
  "Imo": ["Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli", "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri South", "Unuimo"],
  "Jigawa": ["Babura", "Birnin Kudu", "Dutse", "Garki", "Gumel", "Guri", "Gwaram", "Hadejia", "Jahun", "Kazaure", "Kiyawa", "Ringim", "Roni", "Taura"],
  "Kaduna": ["Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"],
  "Kano": ["Albasu", "Babura", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko", "Garun Mallam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Minjibir", "Nasarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"],
  "Katsina": ["Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume", "Danja", "Dan Musa", "Daura", "Dutsin Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"],
  "Kebbi": ["Aleiro", "Argungu", "Augie", "Bagudo", "Birnin Kebbi", "Bunza", "Jega", "Kalgo", "Maiyama", "Ngaski", "Yauri", "Zuru"],
  "Kogi": ["Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Ijumu", "Kabba/Bunu", "Lokoja", "Ofu", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"],
  "Kwara": ["Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero", "Oyun", "Pategi"],
  "Lagos": ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"],
  "Nasarawa": ["Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"],
  "Niger": ["Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Munya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"],
  "Ogun": ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Egbado North", "Egbado South", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Shagamu"],
  "Ondo": ["Akoko North-East", "Akoko North-West", "Akoko South-West", "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo"],
  "Osun": ["Atakunmosa East", "Atakunmosa West", "Aiyedaade", "Aiyedire", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Ife Central", "Ife East", "Ife North", "Ife South", "Egbedore", "Ejigbo", "Ila", "Ilesa East", "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin", "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"],
  "Oyo": ["Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"],
  "Plateau": ["Bokkos", "Barkin Ladi", "Bassa", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"],
  "Rivers": ["Abua/Odual", "Ahoada East", "Ahoada West", "Akuku Toru", "Andoni", "Asari-Toru", "Bonny", "Degema", "Eleme", "Emuoha", "Etche", "Gokana", "Ikwerre", "Khana", "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo", "Port Harcourt", "Tai"],
  "Sokoto": ["Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"],
  "Taraba": ["Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", "Kurmi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"],
  "Yobe": ["Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"],
  "Zamfara": ["Anka", "Bakura", "Bukkuyum", "Bungudu", "Gummi", "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Zurmi"]
};

const ServicesPortal: React.FC = () => {
  const { token } = useAuth();

  // Dynamic Directors state for Company Incorporation
  interface DirectorInfo {
    surname: string;
    firstName: string;
    otherName: string;
    email: string;
    phone: string;
    gender: string;
    dob: string;
    shareAllotment: string;
  }
  const [directors, setDirectors] = useState<DirectorInfo[]>([
    { surname: '', firstName: '', otherName: '', email: '', phone: '', gender: 'Male', dob: '', shareAllotment: '500000' }
  ]);

  // Dynamic Trustees state for NGOs
  interface TrusteeInfo {
    surname: string;
    firstName: string;
    otherName: string;
    email: string;
    phone: string;
    gender: string;
    dob: string;
    position: string;
  }
  const [trustees, setTrustees] = useState<TrusteeInfo[]>([
    { surname: '', firstName: '', otherName: '', email: '', phone: '', gender: 'Male', dob: '', position: 'Chairman' }
  ]);

  // Survey States
  const [surveyUsability, setSurveyUsability] = useState<number>(5);
  const [surveySpeed, setSurveySpeed] = useState<number>(5);
  const [surveyClarity, setSurveyClarity] = useState<string>('Yes');
  const [surveySuggestions, setSurveySuggestions] = useState<string>('');
  const [surveySubmitted, setSurveySubmitted] = useState<boolean>(false);
  const [submittingSurvey, setSubmittingSurvey] = useState<boolean>(false);
  const [showSurveyModal, setShowSurveyModal] = useState<boolean>(false);
  
  // Navigation & Page State
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [formStep, setFormStep] = useState<number>(1);
  
  // Form fields
  const [natureOfBusiness, setNatureOfBusiness] = useState<string>('');
  const [shareCapital, setShareCapital] = useState<string>('1,000,000');
  
  // Annual Filing / Compliance fields
  const [rcNumber, setRcNumber] = useState<string>('');
  const [filingYear, setFilingYear] = useState<string>('2026');
  const [complianceType, setComplianceType] = useState<string>('SCUML Registration');
  const [detailsText, setDetailsText] = useState<string>('');

  // Brand new detailed questions states
  const [companyName1, setCompanyName1] = useState<string>('');
  const [companyName2, setCompanyName2] = useState<string>('');
  const [surname, setSurname] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [otherName, setOtherName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');
  const [partyEmail, setPartyEmail] = useState<string>('');
  const [partyPhone, setPartyPhone] = useState<string>('');
  
  // Addresses states
  const [resState, setResState] = useState<string>('');
  const [resLga, setResLga] = useState<string>('');
  const [resCity, setResCity] = useState<string>('');
  const [resHouseNum, setResHouseNum] = useState<string>('');
  
  const [busState, setBusState] = useState<string>('');
  const [busLga, setBusLga] = useState<string>('');
  const [busCity, setBusCity] = useState<string>('');
  const [busStreet, setBusStreet] = useState<string>('');
  
  const [businessEmail, setBusinessEmail] = useState<string>('');

  // Annual Returns extra fields
  const [incDate, setIncDate] = useState<string>('');
  const [lastFilingDate, setLastFilingDate] = useState<string>('');

  // Post-incorporation sub-services states
  const [selectedSubServices, setSelectedSubServices] = useState<string[]>([]);
  const [subServiceFiles, setSubServiceFiles] = useState<Record<string, File[]>>({});

  // Compliance sub-services states
  const [selectedComplianceServices, setSelectedComplianceServices] = useState<string[]>([]);

  // Other services sub-services states
  const [selectedOtherServices, setSelectedOtherServices] = useState<string[]>([]);

  // Compliance personal details states
  const [compMaritalStatus, setCompMaritalStatus] = useState<string>('Single');
  const [compStateOfOrigin, setCompStateOfOrigin] = useState<string>('');
  const [compLgaOfOrigin, setCompLgaOfOrigin] = useState<string>('');
  const [compPlaceOfBirth, setCompPlaceOfBirth] = useState<string>('');
  const [compNin, setCompNin] = useState<string>('');
  const [compAddress, setCompAddress] = useState<string>('');

  // Compliance Next of Kin details states
  const [compNokFirstName, setCompNokFirstName] = useState<string>('');
  const [compNokOtherName, setCompNokOtherName] = useState<string>('');
  const [compNokSurname, setCompNokSurname] = useState<string>('');
  const [compNokRelationship, setCompNokRelationship] = useState<string>('');
  const [compNokAddress, setCompNokAddress] = useState<string>('');
  const [compNokEmail, setCompNokEmail] = useState<string>('');
  const [compNokPhone, setCompNokPhone] = useState<string>('');
  const [compBvn, setCompBvn] = useState<string>('');

  // Compliance 5 required files state
  const [complianceRequiredFiles, setComplianceRequiredFiles] = useState<Record<string, File[]>>({
    'Passport photography': [],
    'Signature': [],
    'NIN slip': [],
    'CAC document': [],
    'company letter head': []
  });

  // Listen to navigation events from Global Search
  React.useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.serviceId) {
        setSelectedService(customEvent.detail.serviceId);
        setFormStep(1);
        if (customEvent.detail.sub) {
          if (customEvent.detail.serviceId === 'other_services') {
            setSelectedOtherServices([customEvent.detail.sub]);
          } else if (customEvent.detail.serviceId === 'compliance') {
            setComplianceType(customEvent.detail.sub);
          }
        }
      }
    };
    window.addEventListener('navigate-service', handleNav);
    return () => window.removeEventListener('navigate-service', handleNav);
  }, []);

  // Multiple Files Queue
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  
  // State indicators
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const servicesList: ServiceOption[] = [
    { id: 'company_incorporation', title: 'Company Incorporation', description: 'Incorporate a private or public limited company with CAC.', icon: Building2 },
    { id: 'business_registration', title: 'Business Name Registration', description: 'Register a sole proprietorship or partnership trading name.', icon: FileCheck2 },
    { id: 'incorporated_trustee', title: 'Incorporated Trustee', description: 'Incorporate NGOs, churches, mosques, clubs, or associations.', icon: FolderHeart },
    { id: 'annual_returns', title: 'Annual Return Filing', description: 'File mandatory annual reports to CAC to keep status active.', icon: RefreshCw },
    { id: 'post_incorporation', title: 'Post-Incorporation Services', description: 'Change directors, increase share capital, or modify company info.', icon: GitPullRequest },
    { id: 'compliance', title: 'Compliance Services', description: 'SCUML registrations, NRS tax clearance, and regulatory filings.', icon: ShieldAlert },
    { id: 'other_services', title: 'Other Services', description: 'Export licences, Mining licences, NAFDAC registrations, SON compliance, Newspaper publications.', icon: FileText },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (uploadFiles.length + filesArray.length > 5) {
        setError("You can only upload a maximum of 5 documents at a time.");
        return;
      }
      const validFiles = filesArray.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          setError(`File "${file.name}" exceeds the 5MB security limit.`);
          return false;
        }
        return true;
      });
      setUploadFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => /^\+?[0-9\s\-]{7,20}$/.test(phone);
  const isValidName = (name: string) => /^[a-zA-Z\s\-\.']{2,50}$/.test(name);

  const validateStep = (): boolean => {
    setError(null);
    if (formStep === 1) {
      if (['company_incorporation', 'business_registration', 'incorporated_trustee'].includes(selectedService!)) {
        if (!companyName1.trim()) {
          setError('Company Name Option 1 is required.');
          return false;
        }
        if (!companyName2.trim()) {
          setError('Company Name Option 2 is required.');
          return false;
        }
        if (!natureOfBusiness.trim()) {
          setError(selectedService === 'company_incorporation' ? 'Nature of Business is required.' : 'Objectives description is required.');
          return false;
        }
        if (!businessEmail.trim()) {
          setError('Business functional Email is required.');
          return false;
        }
        if (!isValidEmail(businessEmail)) {
          setError('Business functional Email format is invalid.');
          return false;
        }
      } else {
        if (selectedService !== 'other_services' && !rcNumber.trim()) {
          setError(selectedService === 'compliance' ? 'Tax ID / TIN Number is required.' : 'CAC RC Number is required.');
          return false;
        }
        if (selectedService === 'annual_returns') {
          if (!incDate.trim()) {
            setError('Date of Incorporation is required.');
            return false;
          }
          if (!lastFilingDate.trim()) {
            setError('Last Filing Date is required.');
            return false;
          }
        }
        if (selectedService === 'post_incorporation') {
          if (selectedSubServices.length === 0) {
            setError('Please select at least one post-incorporation sub-service.');
            return false;
          }
        }
        if (selectedService === 'compliance') {
          if (selectedComplianceServices.length === 0) {
            setError('Please select at least one compliance service.');
            return false;
          }
        }
        if (selectedService === 'other_services') {
          if (selectedOtherServices.length === 0) {
            setError('Please select at least one other service.');
            return false;
          }
        }
      }
    } else if (formStep === 2) {
      if (selectedService === 'company_incorporation') {
        for (let i = 0; i < directors.length; i++) {
          const d = directors[i];
          if (!d.surname.trim()) {
            setError(`Surname is required for Director #${i + 1}.`);
            return false;
          }
          if (!d.firstName.trim()) {
            setError(`First name is required for Director #${i + 1}.`);
            return false;
          }
          if (!d.dob.trim()) {
            setError(`Date of birth is required for Director #${i + 1}.`);
            return false;
          }
          if (!d.email.trim()) {
            setError(`Email address is required for Director #${i + 1}.`);
            return false;
          }
          if (!d.phone.trim()) {
            setError(`Phone number is required for Director #${i + 1}.`);
            return false;
          }
          if (!isValidName(d.surname) || !isValidName(d.firstName) || (d.otherName.trim() && !isValidName(d.otherName))) {
            setError(`Names must contain only alphabetic characters for Director #${i + 1}.`);
            return false;
          }
          if (!isValidEmail(d.email)) {
            setError(`Invalid email address format for Director #${i + 1}.`);
            return false;
          }
          if (!isValidPhone(d.phone)) {
            setError(`Invalid phone number format for Director #${i + 1}.`);
            return false;
          }
        }
        // Company address validation
        if (!busState.trim() || !busLga.trim() || !busCity.trim() || !busStreet.trim()) {
          setError('All fields of Registered Company Address are required.');
          return false;
        }
      } else if (selectedService === 'incorporated_trustee') {
        for (let i = 0; i < trustees.length; i++) {
          const t = trustees[i];
          if (!t.surname.trim()) {
            setError(`Surname is required for Trustee Member #${i + 1}.`);
            return false;
          }
          if (!t.firstName.trim()) {
            setError(`First name is required for Trustee Member #${i + 1}.`);
            return false;
          }
          if (!t.dob.trim()) {
            setError(`Date of birth is required for Trustee Member #${i + 1}.`);
            return false;
          }
          if (!t.email.trim()) {
            setError(`Email address is required for Trustee Member #${i + 1}.`);
            return false;
          }
          if (!t.phone.trim()) {
            setError(`Phone number is required for Trustee Member #${i + 1}.`);
            return false;
          }
          if (!t.position.trim()) {
            setError(`Position is required for Trustee Member #${i + 1}.`);
            return false;
          }
          if (!isValidName(t.surname) || !isValidName(t.firstName) || (t.otherName.trim() && !isValidName(t.otherName))) {
            setError(`Names must contain only alphabetic characters for Trustee Member #${i + 1}.`);
            return false;
          }
          if (!isValidEmail(t.email)) {
            setError(`Invalid email address format for Trustee Member #${i + 1}.`);
            return false;
          }
          if (!isValidPhone(t.phone)) {
            setError(`Invalid phone number format for Trustee Member #${i + 1}.`);
            return false;
          }
        }
        // Association address validation
        if (!busState.trim() || !busLga.trim() || !busCity.trim() || !busStreet.trim()) {
          setError('All fields of Registered Association Address are required.');
          return false;
        }
      } else if (selectedService === 'business_registration') {
        if (!surname.trim()) {
          setError('Surname is required.');
          return false;
        }
        if (!firstName.trim()) {
          setError('First name is required.');
          return false;
        }
        if (!dob.trim()) {
          setError('Date of birth is required.');
          return false;
        }
        if (!partyEmail.trim()) {
          setError('Email address is required.');
          return false;
        }
        if (!partyPhone.trim()) {
          setError('Phone number is required.');
          return false;
        }
        if (!isValidName(surname) || !isValidName(firstName) || (otherName.trim() && !isValidName(otherName))) {
          setError('Names must contain only alphabetic characters.');
          return false;
        }
        if (!isValidEmail(partyEmail)) {
          setError('Invalid email address format.');
          return false;
        }
        if (!isValidPhone(partyPhone)) {
          setError('Invalid phone number format.');
          return false;
        }
        // Residential address validation
        if (!resState.trim() || !resLga.trim() || !resCity.trim() || !resHouseNum.trim()) {
          setError('All fields of Residential Address are required.');
          return false;
        }
        // Business address validation
        if (!busState.trim() || !busLga.trim() || !busCity.trim() || !busStreet.trim()) {
          setError('All fields of Business Address are required.');
          return false;
        }
      } else if (selectedService === 'compliance') {
        if (!firstName.trim()) {
          setError('First name is required.');
          return false;
        }
        if (!surname.trim()) {
          setError('Surname is required.');
          return false;
        }
        if (!partyPhone.trim()) {
          setError('Phone number is required.');
          return false;
        }
        if (!partyEmail.trim()) {
          setError('Email address is required.');
          return false;
        }
        if (!dob.trim()) {
          setError('Date of birth is required.');
          return false;
        }
        if (!compMaritalStatus.trim()) {
          setError('Marital status is required.');
          return false;
        }
        if (!compStateOfOrigin.trim()) {
          setError('State of Origin is required.');
          return false;
        }
        if (!compLgaOfOrigin.trim()) {
          setError('LGA of Origin is required.');
          return false;
        }
        if (!compPlaceOfBirth.trim()) {
          setError('Place of birth is required.');
          return false;
        }
        if (!compNin.trim()) {
          setError('National ID Number (NIN) is required.');
          return false;
        }
        if (!compAddress.trim()) {
          setError('Address is required.');
          return false;
        }

        if (!isValidName(firstName) || !isValidName(surname) || (otherName.trim() && !isValidName(otherName))) {
          setError('Names must contain only alphabetic characters.');
          return false;
        }
        if (!isValidEmail(partyEmail)) {
          setError('Invalid email address format.');
          return false;
        }
        if (!isValidPhone(partyPhone)) {
          setError('Invalid phone number format.');
          return false;
        }
        if (!isValidPhone(compNin) || compNin.trim().length !== 11) {
          setError('National ID Number (NIN) must be exactly 11 digits.');
          return false;
        }

        // NOK
        if (!compNokFirstName.trim()) {
          setError('Next of Kin First name is required.');
          return false;
        }
        if (!compNokSurname.trim()) {
          setError('Next of Kin Surname is required.');
          return false;
        }
        if (!compNokRelationship.trim()) {
          setError('Relationship with next of kin is required.');
          return false;
        }
        if (!compNokAddress.trim()) {
          setError('Next of Kin Address is required.');
          return false;
        }
        if (!compNokPhone.trim()) {
          setError('Next of Kin Phone is required.');
          return false;
        }
        if (!compBvn.trim()) {
          setError('BVN is required.');
          return false;
        }

        if (!isValidName(compNokFirstName) || !isValidName(compNokSurname) || (compNokOtherName.trim() && !isValidName(compNokOtherName))) {
          setError('Next of Kin names must contain only alphabetic characters.');
          return false;
        }
        if (compNokEmail.trim() && !isValidEmail(compNokEmail)) {
          setError('Invalid Next of Kin email address format.');
          return false;
        }
        if (!isValidPhone(compNokPhone)) {
          setError('Invalid Next of Kin phone number format.');
          return false;
        }
        if (!isValidPhone(compBvn) || compBvn.trim().length !== 11) {
          setError('BVN must be exactly 11 digits.');
          return false;
        }
      } else {
        // detailsText is optional in step 2
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setFormStep(prev => prev + 1);
    }
  };

  const handleBackStep = () => {
    setError(null);
    if (formStep > 1) {
      setFormStep(prev => prev - 1);
    } else {
      setSelectedService(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    if (formStep < 3) {
      handleNextStep();
      return;
    }
    if (!validateStep()) return;

    if (['post_incorporation', 'other_services'].includes(selectedService!)) {
      const activeSubServices = selectedService === 'post_incorporation' ? selectedSubServices : selectedOtherServices;
      for (const sub of activeSubServices) {
        const files = subServiceFiles[sub] || [];
        if (files.length === 0) {
          setError(`Please select and upload at least one supporting document for: ${sub}`);
          return;
        }
      }
    }

    if (selectedService === 'compliance') {
      const requiredDocs = ['Passport photography', 'Signature', 'NIN slip', 'CAC document', 'company letter head'];
      for (const docType of requiredDocs) {
        const files = complianceRequiredFiles[docType] || [];
        if (files.length === 0) {
          setError(`Please select and upload at least one file for: ${docType}`);
          return;
        }
      }
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Build details JSON
    let detailsObj: any = {};
    if (['company_incorporation', 'business_registration', 'incorporated_trustee'].includes(selectedService!)) {
      detailsObj = {
        companyNameOption1: companyName1,
        companyNameOption2: companyName2,
        proposedNames: [companyName1, companyName2].filter(Boolean),
        representative: selectedService === 'business_registration' ? {
          surname,
          firstName,
          otherName,
          dob,
          gender,
          email: partyEmail,
          phone: partyPhone,
          residentialAddress: {
            state: resState,
            lga: resLga,
            city: resCity,
            houseNumber: resHouseNum
          }
        } : undefined,
        directors: selectedService === 'company_incorporation' ? directors : undefined,
        trustees: selectedService === 'incorporated_trustee' ? trustees : undefined,
        address: {
          state: busState,
          lga: busLga,
          city: busCity,
          streetName: busStreet
        },
        natureOfBusiness: natureOfBusiness,
        functionalEmail: businessEmail,
        shareCapital: selectedService === 'company_incorporation' ? shareCapital : undefined
      };
    } else if (selectedService === 'annual_returns') {
      detailsObj = {
        rcNumber,
        filingYear,
        natureOfBusiness,
        incorporationDate: incDate,
        lastFilingDate: lastFilingDate,
        details: detailsText
      };
    } else if (selectedService === 'compliance') {
      detailsObj = {
        complianceType,
        taxId: rcNumber,
        subServices: selectedComplianceServices,
        personalDetails: {
          firstName,
          otherName,
          surname,
          phone: partyPhone,
          email: partyEmail,
          maritalStatus: compMaritalStatus,
          stateOfOrigin: compStateOfOrigin,
          lgaOfOrigin: compLgaOfOrigin,
          placeOfBirth: compPlaceOfBirth,
          nin: compNin,
          dob,
          address: compAddress
        },
        nextOfKin: {
          firstName: compNokFirstName,
          otherName: compNokOtherName,
          surname: compNokSurname,
          relationship: compNokRelationship,
          address: compNokAddress,
          email: compNokEmail,
          phone: compNokPhone
        },
        bvn: compBvn,
        details: detailsText
      };
    } else if (selectedService === 'post_incorporation') {
      detailsObj = {
        rcNumber,
        subServices: selectedSubServices,
        details: detailsText
      };
    } else if (selectedService === 'other_services') {
      detailsObj = {
        subServices: selectedOtherServices,
        details: detailsText
      };
    } else {
      detailsObj = {
        requestType: complianceType,
        rcNumber,
        details: detailsText
      };
    }

    try {
      // 1. Submit Application
      const appRes = await fetch(`${API_BASE}/services/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          service_type: selectedService,
          details: detailsObj
        })
      });

      const appData = await appRes.json();
      if (!appRes.ok) throw new Error(appData.error || 'Failed to submit application');

      const newAppId = appData.id;

      // 2. Loop and upload files sequentially
      if (['post_incorporation', 'compliance', 'other_services'].includes(selectedService)) {
        if (['post_incorporation', 'other_services'].includes(selectedService)) {
          const activeSubServices = selectedService === 'post_incorporation' ? selectedSubServices : selectedOtherServices;
          for (const sub of activeSubServices) {
            const files = subServiceFiles[sub] || [];
            for (const file of files) {
              const formData = new FormData();
              const renamedFile = new File([file], `[${sub}] ${file.name}`, { type: file.type });
              formData.append('file', renamedFile);
              formData.append('application_id', newAppId.toString());

              const uploadRes = await fetch(`${API_BASE}/documents/upload`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`
                },
                body: formData
              });

              const uploadData = await uploadRes.json();
              if (!uploadRes.ok) {
                throw new Error(`Application submitted, but file "${file.name}" for "${sub}" failed: ${uploadData.error}`);
              }
            }
          }
        } else {
          // compliance
          const requiredDocs = ['Passport photography', 'Signature', 'NIN slip', 'CAC document', 'company letter head'];
          for (const docType of requiredDocs) {
            const files = complianceRequiredFiles[docType] || [];
            for (const file of files) {
              const formData = new FormData();
              const renamedFile = new File([file], `[${docType}] ${file.name}`, { type: file.type });
              formData.append('file', renamedFile);
              formData.append('application_id', newAppId.toString());

              const uploadRes = await fetch(`${API_BASE}/documents/upload`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`
                },
                body: formData
              });

              const uploadData = await uploadRes.json();
              if (!uploadRes.ok) {
                throw new Error(`Application submitted, but file "${file.name}" for "${docType}" failed: ${uploadData.error}`);
              }
            }
          }
        }
      } else if (uploadFiles.length > 0) {
        for (const file of uploadFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('application_id', newAppId.toString());

          const uploadRes = await fetch(`${API_BASE}/documents/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) {
            throw new Error(`Application submitted, but file "${file.name}" upload failed: ${uploadData.error}`);
          }
        }
      }

      setSuccessMsg(`Service application submitted successfully! Reference ID: #${newAppId}`);
      
      // Trigger Satisfaction Survey Modal
      setShowSurveyModal(true);
      setSurveyUsability(5);
      setSurveySpeed(5);
      setSurveyClarity('Yes');
      setSurveySuggestions('');
      setSurveySubmitted(false);

      // Reset form
      setNatureOfBusiness('');
      setRcNumber('');
      setDetailsText('');
      setUploadFiles([]);
      setSelectedService(null);
      setFormStep(1);
      setDirectors([{ surname: '', firstName: '', otherName: '', email: '', phone: '', gender: 'Male', dob: '', shareAllotment: '500000' }]);
      setTrustees([{ surname: '', firstName: '', otherName: '', email: '', phone: '', gender: 'Male', dob: '', position: 'Chairman' }]);
      setSelectedSubServices([]);
      setSubServiceFiles({});
      setSelectedComplianceServices([]);
      setSelectedOtherServices([]);
      
      setCompMaritalStatus('Single');
      setCompStateOfOrigin('');
      setCompLgaOfOrigin('');
      setCompPlaceOfBirth('');
      setCompNin('');
      setCompAddress('');
      setCompNokFirstName('');
      setCompNokOtherName('');
      setCompNokSurname('');
      setCompNokRelationship('');
      setCompNokAddress('');
      setCompNokEmail('');
      setCompNokPhone('');
      setCompBvn('');
      setComplianceRequiredFiles({
        'Passport photography': [],
        'Signature': [],
        'NIN slip': [],
        'CAC document': [],
        'company letter head': []
      });

      // Detailed fields reset
      setCompanyName1('');
      setCompanyName2('');
      setSurname('');
      setFirstName('');
      setOtherName('');
      setDob('');
      setGender('Male');
      setPartyEmail('');
      setPartyPhone('');
      setResState('');
      setResLga('');
      setResCity('');
      setResHouseNum('');
      setBusState('');
      setBusLga('');
      setBusCity('');
      setBusStreet('');
      setBusinessEmail('');
      setIncDate('');
      setLastFilingDate('');

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in page-container">
      
      {!selectedService ? (
        // Grid of services
        <>
          <div style={{ marginBottom: '10px' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '4px' }}>Choose a Service</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Select one of PrimeFlow Abuja's 6 core corporate registration and compliance consulting services.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {servicesList.map((service) => {
              const Icon = service.icon;
              return (
                <div 
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service.id);
                    setFormStep(1);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="glass-panel-interactive"
                  style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <div style={{ 
                    alignSelf: 'flex-start',
                    padding: '12px', 
                    borderRadius: '8px', 
                    background: 'var(--accent-red-dim)', 
                    border: '1px solid rgba(229, 62, 62, 0.2)', 
                    color: 'var(--accent-red)' 
                  }}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '6px' }}>{service.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>{service.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        // Multi-Step Submission Form
        <div className="glass-panel" style={{ padding: '30px', maxWidth: '700px', margin: '0 auto', width: '100%' }}>
          
          {/* Form Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>
                {servicesList.find(s => s.id === selectedService)?.title}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {['company_incorporation', 'business_registration', 'incorporated_trustee', 'annual_returns', 'post_incorporation'].includes(selectedService!)
                  ? 'CAC Regulatory Filing Requirement Form'
                  : 'Filing & Licensing Requirement Form'}
              </span>
            </div>
            <button 
              onClick={() => { setSelectedService(null); setError(null); }}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Back to List
            </button>
          </div>

          {/* Paginated Progress Steps */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 30px 0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '18px', left: '10%', right: '10%', height: '2px', background: 'rgba(255,255,255,0.06)', zIndex: 1 }} />
            <div style={{ position: 'absolute', top: '18px', left: '10%', width: formStep === 1 ? '0%' : formStep === 2 ? '40%' : '80%', height: '2px', background: 'var(--accent-red)', zIndex: 2, transition: 'width 0.3s ease' }} />
            
            {/* Step 1 Node */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 5, flex: 1 }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: formStep >= 1 ? 'var(--accent-red-dim)' : 'var(--bg-secondary)',
                border: formStep >= 1 ? '2px solid var(--accent-red)' : '2px solid var(--border-color)',
                color: formStep >= 1 ? 'var(--accent-red)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                transition: 'all 0.3s ease'
              }}>
                <FileText size={18} />
              </div>
              <span style={{ fontSize: '0.75rem', color: formStep >= 1 ? '#fff' : 'var(--text-secondary)', fontWeight: '600' }}>General Details</span>
            </div>

            {/* Step 2 Node */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 5, flex: 1 }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: formStep >= 2 ? 'var(--accent-red-dim)' : 'var(--bg-secondary)',
                border: formStep >= 2 ? '2px solid var(--accent-red)' : '2px solid var(--border-color)',
                color: formStep >= 2 ? 'var(--accent-red)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                transition: 'all 0.3s ease'
              }}>
                <User size={18} />
              </div>
              <span style={{ fontSize: '0.75rem', color: formStep >= 2 ? '#fff' : 'var(--text-secondary)', fontWeight: '600' }}>Specific Data</span>
            </div>

            {/* Step 3 Node */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 5, flex: 1 }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: formStep >= 3 ? 'var(--accent-red-dim)' : 'var(--bg-secondary)',
                border: formStep >= 3 ? '2px solid var(--accent-red)' : '2px solid var(--border-color)',
                color: formStep >= 3 ? 'var(--accent-red)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                transition: 'all 0.3s ease'
              }}>
                <Upload size={18} />
              </div>
              <span style={{ fontSize: '0.75rem', color: formStep >= 3 ? '#fff' : 'var(--text-secondary)', fontWeight: '600' }}>Attachments</span>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px', background: 'rgba(229,62,62,0.08)', border: '1px solid var(--accent-red)', borderRadius: '8px', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', marginBottom: '20px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '12px', background: 'rgba(72,187,120,0.08)', border: '1px solid #48bb78', borderRadius: '8px', color: '#48bb78', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', marginBottom: '20px' }}>
              <Check size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* STEP 1: General Info */}
            {formStep === 1 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['company_incorporation', 'business_registration', 'incorporated_trustee'].includes(selectedService!) ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">*Company name option 1:*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. PrimeFlow Consultants Ltd"
                          className="form-input"
                          value={companyName1}
                          onChange={(e) => setCompanyName1(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">*Company name option 2:*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. PrimeFlow Abuja Ltd"
                          className="form-input"
                          value={companyName2}
                          onChange={(e) => setCompanyName2(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {selectedService === 'company_incorporation' ? '10. Nature of Business:' : '10. OBJECTIVES:'}
                      </label>
                      <textarea
                        required
                        placeholder={selectedService === 'company_incorporation' ? "Describe the nature of business..." : "Describe the objectives of the entity..."}
                        className="form-input"
                        style={{ minHeight: '80px', resize: 'vertical' }}
                        value={natureOfBusiness}
                        onChange={(e) => setNatureOfBusiness(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {selectedService === 'company_incorporation' ? '11. Business functional Email:' : 
                         selectedService === 'business_registration' ? '11. BUSINESS functional Email:' : 
                         '11. Association functional Email:'}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. info@primeflow.com"
                        className="form-input"
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                      />
                    </div>

                    {selectedService === 'company_incorporation' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">Authorized Share Capital (NGN)</label>
                          <select 
                            className="form-select"
                            value={shareCapital}
                            onChange={(e) => setShareCapital(e.target.value)}
                          >
                            <option value="1,000,000">1,000,000 (Standard SME)</option>
                            <option value="5,000,000">5,000,000 (Medium Scale)</option>
                            <option value="10,000,000">10,000,000+ (Corporate Scale)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">12. Share capital allotment</label>
                          <input
                            type="text"
                            readOnly
                            className="form-input"
                            value="100% share capital allotment"
                            style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {selectedService !== 'other_services' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            {selectedService === 'compliance' ? 'Tax ID / TIN Number' : 'CAC RC Number'}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. RC-1234567"
                            className="form-input"
                            value={rcNumber}
                            onChange={(e) => setRcNumber(e.target.value)}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            {selectedService === 'annual_returns' ? 'Filing Year' : 'Request Category'}
                          </label>
                          {selectedService === 'annual_returns' ? (
                            <select 
                              className="form-select"
                              value={filingYear}
                              onChange={(e) => setFilingYear(e.target.value)}
                            >
                              <option value="2026">2026</option>
                              <option value="2025">2025</option>
                              <option value="2024">2024</option>
                            </select>
                          ) : (
                            <select 
                              className="form-select"
                              value={complianceType}
                              onChange={(e) => {
                                const val = e.target.value;
                                setComplianceType(val);
                                if (selectedService === 'compliance') {
                                  if (val && !selectedComplianceServices.includes(val)) {
                                    setSelectedComplianceServices(prev => [...prev, val]);
                                  }
                                }
                              }}
                            >
                              {selectedService === 'compliance' ? (
                                <>
                                  <option value="">-- Choose/Select a Service --</option>
                                  <option value="Pencom">Pencom</option>
                                  <option value="ITF">ITF</option>
                                  <option value="NSITF">NSITF</option>
                                  <option value="TCC">TCC</option>
                                  <option value="BPP">BPP</option>
                                  <option value="SCUML">SCUML</option>
                                </>
                              ) : (
                                <>
                                  <option value="Change of Directors">Change of Directors</option>
                                  <option value="Change of Registered Address">Change of Company Address</option>
                                  <option value="Increase Share Capital">Increase in Share Capital</option>
                                </>
                              )}
                            </select>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedService === 'annual_returns' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
                        <div className="form-group">
                          <label className="form-label">Date of Incorporation</label>
                          <input
                            type="date"
                            required
                            className="form-input"
                            max={new Date().toISOString().split('T')[0]}
                            value={incDate}
                            onChange={(e) => setIncDate(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Last Filing Date</label>
                          <input
                            type="date"
                            required
                            className="form-input"
                            max={new Date().toISOString().split('T')[0]}
                            value={lastFilingDate}
                            onChange={(e) => setLastFilingDate(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    {selectedService === 'post_incorporation' && (
                      <div className="form-group" style={{ marginTop: '16px' }}>
                        <label className="form-label">Select / Tick Sub-Services Needed (Multiple select allowed)</label>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr', 
                          gap: '10px', 
                          maxHeight: '240px', 
                          overflowY: 'auto', 
                          padding: '12px', 
                          background: 'rgba(0,0,0,0.15)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '6px',
                          marginTop: '8px'
                        }}>
                          {POST_INC_SUB_SERVICES.map(sub => {
                            const isChecked = selectedSubServices.includes(sub);
                            return (
                              <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedSubServices(prev => prev.filter(item => item !== sub));
                                    } else {
                                      setSelectedSubServices(prev => [...prev, sub]);
                                    }
                                  }}
                                  style={{
                                    accentColor: 'var(--accent-red)',
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'pointer'
                                  }}
                                />
                                <span>{sub}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {selectedService === 'compliance' && (
                      <div className="form-group" style={{ marginTop: '16px' }}>
                        <label className="form-label">Select / Tick Services Needed (Multiple select allowed)</label>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '10px', 
                          maxHeight: '240px', 
                          overflowY: 'auto', 
                          padding: '12px', 
                          background: 'rgba(0,0,0,0.15)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '6px',
                          marginTop: '8px'
                        }}>
                          {COMPLIANCE_SUB_SERVICES.map(sub => {
                            const isChecked = selectedComplianceServices.includes(sub);
                            return (
                              <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedComplianceServices(prev => prev.filter(item => item !== sub));
                                    } else {
                                      setSelectedComplianceServices(prev => [...prev, sub]);
                                    }
                                  }}
                                  style={{
                                    accentColor: 'var(--accent-red)',
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'pointer'
                                  }}
                                />
                                <span>{sub}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {selectedService === 'other_services' && (
                      <div className="form-group animate-fade-in" style={{ marginTop: '16px' }}>
                        <label className="form-label">Select / Tick Services Needed (Multiple select allowed)</label>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '10px', 
                          maxHeight: '240px', 
                          overflowY: 'auto', 
                          padding: '12px', 
                          background: 'rgba(0,0,0,0.15)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '6px',
                          marginTop: '8px'
                        }}>
                          {OTHER_SUB_SERVICES.map(sub => {
                            const isChecked = selectedOtherServices.includes(sub);
                            return (
                              <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedOtherServices(prev => prev.filter(item => item !== sub));
                                    } else {
                                      setSelectedOtherServices(prev => [...prev, sub]);
                                    }
                                  }}
                                  style={{
                                    accentColor: 'var(--accent-red)',
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'pointer'
                                  }}
                                />
                                <span>{sub}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* STEP 2: Specific Details */}
            {formStep === 2 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedService === 'company_incorporation' && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      Director / Shareholders Personal Details
                    </h4>
                    {directors.map((d, index) => (
                      <div key={index} className="glass-panel animate-fade-in" style={{ padding: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '10px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px', marginBottom: '4px' }}>
                          <h5 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>Director / Shareholder #{index + 1}</h5>
                          {directors.length > 1 && (
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(229, 62, 62, 0.1)', borderColor: 'rgba(229, 62, 62, 0.2)', color: '#f56565' }}
                              onClick={() => setDirectors(prev => prev.filter((_, idx) => idx !== index))}
                            >
                              Remove Director
                            </button>
                          )}
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Surname:</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Sowande"
                              className="form-input"
                              value={d.surname}
                              onChange={(e) => {
                                const updated = [...directors];
                                updated[index].surname = e.target.value;
                                setDirectors(updated);
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">First name:</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Babajide"
                              className="form-input"
                              value={d.firstName}
                              onChange={(e) => {
                                const updated = [...directors];
                                updated[index].firstName = e.target.value;
                                setDirectors(updated);
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Other name:</label>
                            <input
                              type="text"
                              placeholder="e.g. Olusegun"
                              className="form-input"
                              value={d.otherName}
                              onChange={(e) => {
                                const updated = [...directors];
                                updated[index].otherName = e.target.value;
                                setDirectors(updated);
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Date of birth:</label>
                            <input
                              type="date"
                              required
                              max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                              className="form-input"
                              value={d.dob}
                              onChange={(e) => {
                                const updated = [...directors];
                                updated[index].dob = e.target.value;
                                setDirectors(updated);
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Gender:</label>
                            <select 
                              className="form-select"
                              value={d.gender}
                              onChange={(e) => {
                                const updated = [...directors];
                                updated[index].gender = e.target.value;
                                setDirectors(updated);
                              }}
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Share Allotment (Units):</label>
                            <input
                              type="number"
                              required
                              className="form-input"
                              value={d.shareAllotment}
                              onChange={(e) => {
                                const updated = [...directors];
                                updated[index].shareAllotment = e.target.value;
                                setDirectors(updated);
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Email:</label>
                            <input
                              type="email"
                              required
                              placeholder="director@company.com"
                              className="form-input"
                              value={d.email}
                              onChange={(e) => {
                                const updated = [...directors];
                                updated[index].email = e.target.value;
                                setDirectors(updated);
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Phone number:</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. +234 803 123 4567"
                              className="form-input"
                              value={d.phone}
                              onChange={(e) => {
                                const updated = [...directors];
                                updated[index].phone = e.target.value;
                                setDirectors(updated);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-secondary animate-fade-in"
                      style={{ alignSelf: 'flex-start', fontSize: '0.8rem', padding: '6px 14px', marginBottom: '14px' }}
                      onClick={() => setDirectors(prev => [...prev, { surname: '', firstName: '', otherName: '', email: '', phone: '', gender: 'Male', dob: '', shareAllotment: '500000' }])}
                    >
                      + Add Another Director / Shareholder
                    </button>

                    {/* Business Address */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', textAlign: 'left' }}>
                      <h5 style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '8px' }}>YOUR REGISTERED COMPANY ADDRESS:</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                        <div className="form-group">
                          <label className="form-label">State:</label>
                          <select
                            required
                            className="form-select"
                            value={busState}
                            onChange={(e) => {
                              setBusState(e.target.value);
                              setBusLga('');
                            }}
                          >
                            <option value="">Select State</option>
                            {Object.keys(NIGERIA_STATES_AND_LGAS).map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">LGA:</label>
                          <select
                            required
                            className="form-select"
                            value={busLga}
                            onChange={(e) => setBusLga(e.target.value)}
                            disabled={!busState}
                          >
                            <option value="">Select LGA</option>
                            {busState && NIGERIA_STATES_AND_LGAS[busState]?.map(lg => (
                              <option key={lg} value={lg}>{lg}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">City/Town/Village:</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ikeja"
                            className="form-input"
                            value={busCity}
                            onChange={(e) => setBusCity(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Street Name:</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Allen Avenue"
                            className="form-input"
                            value={busStreet}
                            onChange={(e) => setBusStreet(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedService === 'incorporated_trustee' && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      Board of Trustees Personal Details
                    </h4>
                    {trustees.map((t, index) => (
                      <div key={index} className="glass-panel animate-fade-in" style={{ padding: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '10px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px', marginBottom: '4px' }}>
                          <h5 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>Trustee Member #{index + 1}</h5>
                          {trustees.length > 1 && (
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(229, 62, 62, 0.1)', borderColor: 'rgba(229, 62, 62, 0.2)', color: '#f56565' }}
                              onClick={() => setTrustees(prev => prev.filter((_, idx) => idx !== index))}
                            >
                              Remove Trustee
                            </button>
                          )}
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Surname:</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Sowande"
                              className="form-input"
                              value={t.surname}
                              onChange={(e) => {
                                const updated = [...trustees];
                                updated[index].surname = e.target.value;
                                setTrustees(updated);
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">First name:</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Babajide"
                              className="form-input"
                              value={t.firstName}
                              onChange={(e) => {
                                const updated = [...trustees];
                                updated[index].firstName = e.target.value;
                                setTrustees(updated);
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Other name:</label>
                            <input
                              type="text"
                              placeholder="e.g. Olusegun"
                              className="form-input"
                              value={t.otherName}
                              onChange={(e) => {
                                const updated = [...trustees];
                                updated[index].otherName = e.target.value;
                                setTrustees(updated);
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Date of birth:</label>
                            <input
                              type="date"
                              required
                              max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                              className="form-input"
                              value={t.dob}
                              onChange={(e) => {
                                const updated = [...trustees];
                                updated[index].dob = e.target.value;
                                setTrustees(updated);
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Gender:</label>
                            <select 
                              className="form-select"
                              value={t.gender}
                              onChange={(e) => {
                                const updated = [...trustees];
                                updated[index].gender = e.target.value;
                                setTrustees(updated);
                              }}
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Position:</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Chairman, Secretary, Member"
                              className="form-input"
                              value={t.position}
                              onChange={(e) => {
                                const updated = [...trustees];
                                updated[index].position = e.target.value;
                                setTrustees(updated);
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Email:</label>
                            <input
                              type="email"
                              required
                              placeholder="trustee@association.org"
                              className="form-input"
                              value={t.email}
                              onChange={(e) => {
                                const updated = [...trustees];
                                updated[index].email = e.target.value;
                                setTrustees(updated);
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Phone number:</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. +234 803 123 4567"
                              className="form-input"
                              value={t.phone}
                              onChange={(e) => {
                                const updated = [...trustees];
                                updated[index].phone = e.target.value;
                                setTrustees(updated);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-secondary animate-fade-in"
                      style={{ alignSelf: 'flex-start', fontSize: '0.8rem', padding: '6px 14px', marginBottom: '14px' }}
                      onClick={() => setTrustees(prev => [...prev, { surname: '', firstName: '', otherName: '', email: '', phone: '', gender: 'Male', dob: '', position: 'Member' }])}
                    >
                      + Add Another Board Member / Trustee
                    </button>

                    {/* Association Address */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', textAlign: 'left' }}>
                      <h5 style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '8px' }}>YOUR REGISTERED ASSOCIATION ADDRESS:</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                        <div className="form-group">
                          <label className="form-label">State:</label>
                          <select
                            required
                            className="form-select"
                            value={busState}
                            onChange={(e) => {
                              setBusState(e.target.value);
                              setBusLga('');
                            }}
                          >
                            <option value="">Select State</option>
                            {Object.keys(NIGERIA_STATES_AND_LGAS).map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">LGA:</label>
                          <select
                            required
                            className="form-select"
                            value={busLga}
                            onChange={(e) => setBusLga(e.target.value)}
                            disabled={!busState}
                          >
                            <option value="">Select LGA</option>
                            {busState && NIGERIA_STATES_AND_LGAS[busState]?.map(lg => (
                              <option key={lg} value={lg}>{lg}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">City/Town/Village:</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Abuja"
                            className="form-input"
                            value={busCity}
                            onChange={(e) => setBusCity(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Street Name:</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Herbert Macaulay Way"
                            className="form-input"
                            value={busStreet}
                            onChange={(e) => setBusStreet(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedService === 'business_registration' && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      PROPRIETOR Personal Details
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">1. Surname:</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sowande"
                          className="form-input"
                          value={surname}
                          onChange={(e) => setSurname(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">2. First name:</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Babajide"
                          className="form-input"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">3. Other name:</label>
                        <input
                          type="text"
                          placeholder="e.g. Olusegun"
                          className="form-input"
                          value={otherName}
                          onChange={(e) => setOtherName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">4. Date of birth:</label>
                        <input
                          type="date"
                          required
                          max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          className="form-input"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">5. Gender:</label>
                        <select 
                          className="form-select"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">6. Email:</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. rep@primeflow.com"
                          className="form-input"
                          value={partyEmail}
                          onChange={(e) => setPartyEmail(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">7. Phone number:</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. +234 803 123 4567"
                          className="form-input"
                          value={partyPhone}
                          onChange={(e) => setPartyPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Residential Address */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                      <h5 style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '8px' }}>8. YOUR RESIDENTIAL ADDRESS:</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                        <div className="form-group">
                          <label className="form-label">State:</label>
                          <select
                            required
                            className="form-select"
                            value={resState}
                            onChange={(e) => {
                              setResState(e.target.value);
                              setResLga('');
                            }}
                          >
                            <option value="">Select State</option>
                            {Object.keys(NIGERIA_STATES_AND_LGAS).map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">LGA:</label>
                          <select
                            required
                            className="form-select"
                            value={resLga}
                            onChange={(e) => setResLga(e.target.value)}
                            disabled={!resState}
                          >
                            <option value="">Select LGA</option>
                            {resState && NIGERIA_STATES_AND_LGAS[resState]?.map(lg => (
                              <option key={lg} value={lg}>{lg}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">City/Town/Village:</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Wuse"
                            className="form-input"
                            value={resCity}
                            onChange={(e) => setResCity(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">House Number:</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 12"
                            className="form-input"
                            value={resHouseNum}
                            onChange={(e) => setResHouseNum(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business/Association Address */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
                      <h5 style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '8px' }}>9. YOUR BUSINESS ADDRESS:</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                        <div className="form-group">
                          <label className="form-label">State:</label>
                          <select
                            required
                            className="form-select"
                            value={busState}
                            onChange={(e) => {
                              setBusState(e.target.value);
                              setBusLga('');
                            }}
                          >
                            <option value="">Select State</option>
                            {Object.keys(NIGERIA_STATES_AND_LGAS).map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">LGA:</label>
                          <select
                            required
                            className="form-select"
                            value={busLga}
                            onChange={(e) => setBusLga(e.target.value)}
                            disabled={!busState}
                          >
                            <option value="">Select LGA</option>
                            {busState && NIGERIA_STATES_AND_LGAS[busState]?.map(lg => (
                              <option key={lg} value={lg}>{lg}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">City/Town/Village:</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Garki"
                            className="form-input"
                            value={busCity}
                            onChange={(e) => setBusCity(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Street Name:</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Herbert Macaulay Way"
                            className="form-input"
                            value={busStreet}
                            onChange={(e) => setBusStreet(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {selectedService === 'compliance' && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ color: 'var(--accent-red)', fontSize: '1rem', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Personal Details
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">*First name:*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Babajide"
                          className="form-input"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Other name:</label>
                        <input
                          type="text"
                          placeholder="e.g. Olusegun"
                          className="form-input"
                          value={otherName}
                          onChange={(e) => setOtherName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">*Surname:*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sowande"
                          className="form-input"
                          value={surname}
                          onChange={(e) => setSurname(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">*Phone number:*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. +234 803 123 4567"
                          className="form-input"
                          value={partyPhone}
                          onChange={(e) => setPartyPhone(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">*Email:*</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. rep@primeflow.com"
                          className="form-input"
                          value={partyEmail}
                          onChange={(e) => setPartyEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">*Marital status:*</label>
                        <select 
                          className="form-select"
                          value={compMaritalStatus}
                          onChange={(e) => setCompMaritalStatus(e.target.value)}
                        >
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">*Date of birth:*</label>
                        <input
                          type="date"
                          required
                          max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          className="form-input"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">*Place of birth:*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lagos"
                          className="form-input"
                          value={compPlaceOfBirth}
                          onChange={(e) => setCompPlaceOfBirth(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">*State of Origin:*</label>
                        <select
                          required
                          className="form-select"
                          value={compStateOfOrigin}
                          onChange={(e) => {
                            setCompStateOfOrigin(e.target.value);
                            setCompLgaOfOrigin('');
                          }}
                        >
                          <option value="">Select State</option>
                          {Object.keys(NIGERIA_STATES_AND_LGAS).map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">*LGA of Origin:*</label>
                        <select
                          required
                          className="form-select"
                          value={compLgaOfOrigin}
                          onChange={(e) => setCompLgaOfOrigin(e.target.value)}
                          disabled={!compStateOfOrigin}
                        >
                          <option value="">Select LGA</option>
                          {compStateOfOrigin && NIGERIA_STATES_AND_LGAS[compStateOfOrigin]?.map(lg => (
                            <option key={lg} value={lg}>{lg}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">*National ID Number (NIN):*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 12345678901"
                          className="form-input"
                          value={compNin}
                          onChange={(e) => setCompNin(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">*Address:*</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Flat 3, 12 Garki Road, Abuja"
                        className="form-input"
                        value={compAddress}
                        onChange={(e) => setCompAddress(e.target.value)}
                      />
                    </div>

                    {/* NOK Section */}
                    <h4 style={{ color: 'var(--accent-red)', fontSize: '1rem', fontWeight: '700', marginTop: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      Next of Kin (NOK)
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">*NOK First name:*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Adeleke"
                          className="form-input"
                          value={compNokFirstName}
                          onChange={(e) => setCompNokFirstName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">NOK Other name:</label>
                        <input
                          type="text"
                          placeholder="e.g. Gbolahan"
                          className="form-input"
                          value={compNokOtherName}
                          onChange={(e) => setCompNokOtherName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">*NOK Surname:*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sowande"
                          className="form-input"
                          value={compNokSurname}
                          onChange={(e) => setCompNokSurname(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">*Relationship with NOK:*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Brother, Spouse"
                          className="form-input"
                          value={compNokRelationship}
                          onChange={(e) => setCompNokRelationship(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">*NOK Phone:*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. +234 809 999 8888"
                          className="form-input"
                          value={compNokPhone}
                          onChange={(e) => setCompNokPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">NOK Email:</label>
                        <input
                          type="email"
                          placeholder="e.g. nok@example.com"
                          className="form-input"
                          value={compNokEmail}
                          onChange={(e) => setCompNokEmail(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">*BVN:*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 22223333444"
                          className="form-input"
                          value={compBvn}
                          onChange={(e) => setCompBvn(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">*NOK Address:*</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 15 Allen Avenue, Ikeja, Lagos"
                        className="form-input"
                        value={compNokAddress}
                        onChange={(e) => setCompNokAddress(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {!['company_incorporation', 'business_registration', 'incorporated_trustee', 'compliance'].includes(selectedService!) && (
                  <div className="form-group">
                    <label className="form-label">Regulatory Service Details</label>
                    <textarea
                      placeholder="Describe post-incorporation edits, compliance metrics, newspaper publication contents, or mining/export license details (Optional)..."
                      className="form-input"
                      style={{ minHeight: '150px', resize: 'vertical' }}
                      value={detailsText}
                      onChange={(e) => setDetailsText(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Multi-File Attachments & Review */}
            {formStep === 3 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Specific Requirements Notice Alert */}
                {['company_incorporation', 'business_registration', 'incorporated_trustee'].includes(selectedService!) && (
                  <div style={{ padding: '16px', background: 'rgba(229,62,62,0.06)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} /> REQUIRED DOCUMENTS NOTICE
                    </h5>
                    <p style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '600', margin: 0 }}>
                      Note : you are to scan/snap your id card and signature
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      <strong>Means of identification needed:</strong> {
                        selectedService === 'business_registration' 
                          ? 'national I\'d and passport photography.' 
                          : 'international passport, driver licence, national I\'d card, voter card.'
                      }
                    </p>
                  </div>
                )}

                {/* Document Upload Zone */}
                {['post_incorporation', 'compliance', 'other_services'].includes(selectedService!) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h5 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      {selectedService === 'post_incorporation' 
                        ? 'Upload Supporting Documents per Selected Service' 
                        : selectedService === 'other_services'
                          ? 'Upload Supporting Documents for Licenses/Publications'
                          : 'Upload Required Compliance Documents'}
                    </h5>
                    
                    {(selectedService === 'post_incorporation' 
                      ? selectedSubServices 
                      : selectedService === 'other_services'
                        ? selectedOtherServices
                        : ['Passport photography', 'Signature', 'NIN slip', 'CAC document', 'company letter head']
                    ).map((sub) => {
                      const files = (['post_incorporation', 'other_services'].includes(selectedService!)
                        ? subServiceFiles[sub] 
                        : complianceRequiredFiles[sub]) || [];
                      return (
                        <div key={sub} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>
                              {sub} {selectedService === 'compliance' ? '(Required)' : 'Documents'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {files.length} file(s) attached
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                              type="file"
                              id={`upload-${sub}`}
                              multiple
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files) {
                                  const filesArray = Array.from(e.target.files);
                                  const validFiles = filesArray.filter(file => {
                                    if (file.size > 5 * 1024 * 1024) {
                                      setError(`File "${file.name}" exceeds the 5MB security limit.`);
                                      return false;
                                    }
                                    return true;
                                  });
                                  if (['post_incorporation', 'other_services'].includes(selectedService!)) {
                                    setSubServiceFiles(prev => ({
                                      ...prev,
                                      [sub]: [...(prev[sub] || []), ...validFiles]
                                    }));
                                  } else {
                                    setComplianceRequiredFiles(prev => ({
                                      ...prev,
                                      [sub]: [...(prev[sub] || []), ...validFiles]
                                    }));
                                  }
                                  setError(null);
                                }
                              }}
                            />
                            <label
                              htmlFor={`upload-${sub}`}
                              className="btn-secondary"
                              style={{ padding: '6px 16px', fontSize: '0.75rem', cursor: 'pointer', margin: 0 }}
                            >
                              Select Files
                            </label>
                          </div>
                          
                          {files.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                              {files.map((file, fileIdx) => (
                                <div
                                  key={fileIdx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '6px 10px',
                                    background: 'rgba(255,255,255,0.01)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                                    {file.name}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                      {(file.size / 1024).toFixed(1)} KB
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (['post_incorporation', 'other_services'].includes(selectedService!)) {
                                          setSubServiceFiles(prev => ({
                                            ...prev,
                                            [sub]: (prev[sub] || []).filter((_, i) => i !== fileIdx)
                                          }));
                                        } else {
                                          setComplianceRequiredFiles(prev => ({
                                            ...prev,
                                            [sub]: (prev[sub] || []).filter((_, i) => i !== fileIdx)
                                          }));
                                        }
                                      }}
                                      style={{ background: 'none', border: 'none', color: '#fc8181', cursor: 'pointer', display: 'flex' }}
                                      title="Remove file"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div 
                    style={{ 
                      border: '1px dashed var(--border-color)', 
                      borderRadius: '8px', 
                      padding: '24px', 
                      textAlign: 'center', 
                      background: 'rgba(0,0,0,0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Upload size={28} style={{ color: uploadFiles.length > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }} />
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>
                        Attach supporting files (Multi-select allowed)
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                        PDF, DOCX, JPG, PNG up to 5MB maximum per file
                      </span>
                    </div>
                    <input 
                      type="file" 
                      id="doc-upload" 
                      multiple
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="doc-upload"
                      className="btn-secondary"
                      style={{ padding: '8px 20px', fontSize: '0.8rem', cursor: 'pointer', marginTop: '4px' }}
                    >
                      Select Files
                    </label>
                  </div>
                )}

                {/* Upload Queue list */}
                {selectedService !== 'post_incorporation' && selectedService !== 'compliance' && uploadFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h5 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                      Files in Queue ({uploadFiles.length})
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                      {uploadFiles.map((file, idx) => (
                        <div 
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            fontSize: '0.8rem'
                          }}
                        >
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '350px' }}>
                            {file.name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              style={{ background: 'none', border: 'none', color: '#fc8181', cursor: 'pointer', display: 'flex' }}
                              title="Remove file"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review panel */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h5 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Filing Data Summary
                  </h5>
                  <div style={{ padding: '12px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {['company_incorporation', 'business_registration', 'incorporated_trustee'].includes(selectedService!) ? (
                      <>
                        <div><strong>Company Name Option 1:</strong> {companyName1}</div>
                        <div><strong>Company Name Option 2:</strong> {companyName2}</div>
                        <div><strong>Representative:</strong> {surname} {firstName} {otherName}</div>
                        <div><strong>Date of Birth / Gender:</strong> {dob} / {gender}</div>
                        <div><strong>Contact Info:</strong> {partyEmail} | {partyPhone}</div>
                        <div><strong>Residential Address:</strong> House {resHouseNum}, {resCity}, {resLga}, {resState} State</div>
                        <div><strong>{selectedService === 'incorporated_trustee' ? 'Association Address:' : 'Business Address:'}</strong> {busStreet}, {busCity}, {busLga}, {busState} State</div>
                        <div><strong>{selectedService === 'company_incorporation' ? 'Nature of Business:' : 'Objectives:'}</strong> {natureOfBusiness}</div>
                        <div><strong>{selectedService === 'incorporated_trustee' ? 'Association Email:' : 'Business Email:'}</strong> {businessEmail}</div>
                        {selectedService === 'company_incorporation' && (
                          <>
                            <div><strong>Share Capital:</strong> NGN {shareCapital}</div>
                            <div><strong>Share Capital Allotment:</strong> 100% share capital allotment</div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <div><strong>RC Number:</strong> {rcNumber}</div>
                        {selectedService === 'annual_returns' && (
                          <>
                            <div><strong>Filing Year:</strong> {filingYear}</div>
                            <div><strong>Date of Incorporation:</strong> {incDate}</div>
                            <div><strong>Last Filing Date:</strong> {lastFilingDate}</div>
                          </>
                        )}
                        {selectedService === 'post_incorporation' && (
                          <>
                            <div><strong>Selected Services:</strong> {selectedSubServices.join(', ')}</div>
                          </>
                        )}
                        {selectedService === 'compliance' && (
                          <>
                            <div><strong>Selected Compliance Services:</strong> {selectedComplianceServices.join(', ')}</div>
                            <div><strong>Representative Details:</strong> {surname} {firstName} {otherName} | {partyPhone} | {partyEmail}</div>
                            <div><strong>Marital Status / DOB:</strong> {compMaritalStatus} / {dob}</div>
                            <div><strong>State / LGA / Place of Birth:</strong> {compStateOfOrigin} / {compLgaOfOrigin} / {compPlaceOfBirth}</div>
                            <div><strong>NIN / Address:</strong> {compNin} / {compAddress}</div>
                            <div><strong>Next of Kin:</strong> {compNokSurname} {compNokFirstName} ({compNokRelationship}) | {compNokPhone} | {compNokEmail}</div>
                            <div><strong>BVN:</strong> {compBvn}</div>
                          </>
                        )}
                        {detailsText && <div><strong>Details:</strong> {detailsText}</div>}
                      </>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Back and Next / Submit Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              {/* Back Button */}
              <button 
                type="button"
                onClick={handleBackStep}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={loading}
              >
                <ChevronLeft size={16} />
                {formStep === 1 ? 'Cancel Request' : 'Previous'}
              </button>

              {/* Next / Submit Button */}
              {formStep < 3 ? (
                <button 
                  type="button"
                  onClick={handleNextStep}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pulseGlow 1s infinite linear' }} />
                      <span>Submitting Files...</span>
                    </div>
                  ) : (
                    <>
                      <span>Submit Request</span>
                      <CheckCircle2 size={16} />
                    </>
                  )}
                </button>
              )}
            </div>

          </form>

        </div>
      )}

      {showSurveyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '30px',
            borderRadius: '16px',
            textAlign: 'left',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#fff', fontSize: '1.25rem', margin: 0, fontWeight: '700' }}>Satisfaction Survey</h3>
              <button 
                type="button" 
                onClick={() => setShowSurveyModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              We value your feedback! Please rate your experience using the PrimeFlow portal.
            </p>

            {!surveySubmitted ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setSubmittingSurvey(true);
                try {
                  const res = await fetch(`${API_BASE}/services/survey`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      usability: surveyUsability,
                      speed: surveySpeed,
                      clarity: surveyClarity,
                      suggestions: surveySuggestions
                    })
                  });
                  if (res.ok) {
                    setSurveySubmitted(true);
                  }
                } catch (err) {
                  console.error(err);
                } finally {
                  setSubmittingSurvey(false);
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '6px' }}>1. How easy was it to complete your filing? (1-5 Stars)</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSurveyUsability(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          color: star <= surveyUsability ? '#f6e05e' : '#4a5568',
                          transition: 'transform 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '6px' }}>2. How would you rate the speed of our system? (1-5 Stars)</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSurveySpeed(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          color: star <= surveySpeed ? '#f6e05e' : '#4a5568',
                          transition: 'transform 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">3. Are the required documents instructions clear?</label>
                  <select 
                    className="form-select"
                    value={surveyClarity}
                    onChange={(e) => setSurveyClarity(e.target.value)}
                  >
                    <option value="Yes">Yes, very clear</option>
                    <option value="Somewhat">Somewhat clear</option>
                    <option value="No">No, they are confusing</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">4. Any recommendations for system or process improvement?</label>
                  <textarea
                    placeholder="Type your recommendations here..."
                    className="form-input"
                    value={surveySuggestions}
                    onChange={(e) => setSurveySuggestions(e.target.value)}
                    style={{ minHeight: '60px', resize: 'vertical' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                  disabled={submittingSurvey}
                >
                  {submittingSurvey ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px 0', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(72,187,120,0.1)', border: '1px solid #48bb78', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#48bb78', fontSize: '1.5rem' }}>
                  ✓
                </div>
                <h4 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Thank You!</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Your survey response has been saved to help us track and improve system efficiency.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginTop: '12px', padding: '6px 20px' }}
                  onClick={() => setShowSurveyModal(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ServicesPortal;
