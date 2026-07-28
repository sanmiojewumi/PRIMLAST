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
  "SCUML",
  "TIN Validation"
];

const OTHER_SUB_SERVICES = [
  "Trademark Registration",
  "Export licence",
  "Mining licence",
  "NAFDAC",
  "SON",
  "NEWS PAPER PUBLICATIONS",
  "Driver's Licence",
  "Car Dealer's Licence"
];

export const NIGERIA_STATES_AND_LGAS: Record<string, string[]> = {
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

const COMPLIANCE_DOCS_MAP: Record<string, string[]> = {
  "NSITF": ["CAC Certificate", "Director's Identity Card", "Director's Signature"],
  "SCUML": ["All CAC Documents", "TIN Slip"],
  "TIN Validation": ["CAC Certificate", "Utility Bill", "NIN Slip"],
  "ITF": ["CAC Certificate", "Previous NSITF Certificate for renewal"],
  "Pencom": ["CAC Certificate", "Director's Identity Card", "Staff Details"],
  "TCC": ["CAC Certificate", "TIN Slip", "Director's Tax Clearance Slip"],
  "BPP": ["CAC Certificate", "TCC Certificate", "ITF Certificate", "NSITF Certificate"]
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
  
  // Upload Result Modal State
  const [uploadResultModal, setUploadResultModal] = useState<{
    success: boolean;
    message: string;
    files: { name: string; size: number; category?: string }[];
    appId?: number;
    triggerSurvey?: boolean;
  } | null>(null);
  
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

  // --- NSITF Custom Fields ---
  const [nsitfFullName, setNsitfFullName] = useState<string>('');
  const [nsitfMaritalStatus, setNsitfMaritalStatus] = useState<string>('Single');
  const [nsitfDob, setNsitfDob] = useState<string>('');
  const [nsitfResAddress, setNsitfResAddress] = useState<string>('');
  const [nsitfStateOfOrigin, setNsitfStateOfOrigin] = useState<string>('');
  const [nsitfLgaOfOrigin, setNsitfLgaOfOrigin] = useState<string>('');
  const [nsitfPhone, setNsitfPhone] = useState<string>('');
  const [nsitfNin, setNsitfNin] = useState<string>('');
  const [nsitfEmail, setNsitfEmail] = useState<string>('');
  const [nsitfDependentsCount, setNsitfDependentsCount] = useState<string>('0');
  const [nsitfNokName, setNsitfNokName] = useState<string>('');
  const [nsitfNokPhone, setNsitfNokPhone] = useState<string>('');
  const [nsitfNokRelationship, setNsitfNokRelationship] = useState<string>('');
  const [nsitfCompanyAddress, setNsitfCompanyAddress] = useState<string>('');
  const [nsitfCompanyEmail, setNsitfCompanyEmail] = useState<string>('');
  const [nsitfCompanyPhone, setNsitfCompanyPhone] = useState<string>('');
  const [nsitfStaffList, setNsitfStaffList] = useState<{ name: string; designation: string; phone: string; }[]>([
    { name: '', designation: '', phone: '' },
    { name: '', designation: '', phone: '' },
    { name: '', designation: '', phone: '' }
  ]);

  // --- TRADEMARK Custom Fields ---
  const [tmProposedName, setTmProposedName] = useState<string>('');
  const [tmSurname, setTmSurname] = useState<string>('');
  const [tmFirstName, setTmFirstName] = useState<string>('');
  const [tmMiddleName, setTmMiddleName] = useState<string>('');
  const [tmAddress, setTmAddress] = useState<string>('');
  const [tmBusinessClass, setTmBusinessClass] = useState<string>('');
  const [tmPhone, setTmPhone] = useState<string>('');
  const [tmCompanyName, setTmCompanyName] = useState<string>('');
  const [tmEmail, setTmEmail] = useState<string>('');

  // --- SCUML Custom Fields ---
  const [scumlCompanyName, setScumlCompanyName] = useState<string>('');
  const [scumlRcNumber, setScumlRcNumber] = useState<string>('');
  const [scumlIncDate, setScumlIncDate] = useState<string>('');
  const [scumlCompanyAddress, setScumlCompanyAddress] = useState<string>('');
  const [scumlTin, setScumlTin] = useState<string>('');
  const [scumlDirectorName, setScumlDirectorName] = useState<string>('');
  const [scumlDirectorEmail, setScumlDirectorEmail] = useState<string>('');
  const [scumlDirectorPhone, setScumlDirectorPhone] = useState<string>('');
  const [scumlBankName, setScumlBankName] = useState<string>('');
  const [scumlBankAccount, setScumlBankAccount] = useState<string>('');
  const [scumlNin, setScumlNin] = useState<string>('');
  const [scumlDob, setScumlDob] = useState<string>('');
  const [scumlBvn, setScumlBvn] = useState<string>('');
  const [scumlGender, setScumlGender] = useState<string>('Male');

  // --- TIN VALIDATION Custom Fields ---
  const [tvCompanyName, setTvCompanyName] = useState<string>('');
  const [tvRcNumber, setTvRcNumber] = useState<string>('');
  const [tvTin, setTvTin] = useState<string>('');
  const [tvNatureOfBusiness, setTvNatureOfBusiness] = useState<string>('');
  const [tvCompanyAddress, setTvCompanyAddress] = useState<string>('');
  const [tvCompanyPhone, setTvCompanyPhone] = useState<string>('');
  const [tvCompanyEmail, setTvCompanyEmail] = useState<string>('');
  const [tvCommencementDate, setTvCommencementDate] = useState<string>('');
  const [tvAccountingYearEnd, setTvAccountingYearEnd] = useState<string>('');
  const [tvAuthorizedPerson, setTvAuthorizedPerson] = useState<string>('');
  const [tvDirectorEmail, setTvDirectorEmail] = useState<string>('');
  const [tvDirectorPhone, setTvDirectorPhone] = useState<string>('');

  // --- ITF Custom Fields ---
  const [itfCompanyAddress, setItfCompanyAddress] = useState<string>('');
  const [itfEmail, setItfEmail] = useState<string>('');
  const [itfPhone, setItfPhone] = useState<string>('');
  const [itfTin, setItfTin] = useState<string>('');

  // Compliance required files state
  const [complianceRequiredFiles, setComplianceRequiredFiles] = useState<Record<string, File[]>>({});

  const getComplianceRequiredDocs = (): string[] => {
    const docs = new Set<string>();
    selectedComplianceServices.forEach(sub => {
      const subDocs = COMPLIANCE_DOCS_MAP[sub] || ["CAC Certificate", "Director's Identity Card"];
      subDocs.forEach(d => docs.add(d));
    });
    if (docs.size === 0) {
      return ['Signature', 'NIN slip', 'CAC document', 'company letter head'];
    }
    return Array.from(docs);
  };


  const getOtherRequiredDocsList = (): { key: string; label: string; isCustom: boolean }[] => {
    const list: { key: string; label: string; isCustom: boolean }[] = [];
    selectedOtherServices.forEach(sub => {
      if (sub === 'Trademark Registration') {
        list.push({ key: 'CAC Certificate', label: 'CAC Certificate', isCustom: true });
        list.push({ key: 'Company Logo', label: 'Company Logo', isCustom: true });
        list.push({ key: "Director's Signature", label: "Director's Signature", isCustom: true });
      } else {
        list.push({ key: sub, label: `${sub} Supporting Document`, isCustom: false });
      }
    });
    return list;
  };

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
        if (selectedComplianceServices.includes('NSITF')) {
          if (!nsitfFullName.trim()) { setError('NSITF Full name is required.'); return false; }
          if (!nsitfDob.trim()) { setError('NSITF Date of birth is required.'); return false; }
          if (!nsitfResAddress.trim()) { setError('NSITF Residential address is required.'); return false; }
          if (!nsitfStateOfOrigin.trim()) { setError('NSITF State of Origin is required.'); return false; }
          if (!nsitfLgaOfOrigin.trim()) { setError('NSITF Local Govt (LGA) of Origin is required.'); return false; }
          if (!nsitfPhone.trim()) { setError('NSITF Phone number is required.'); return false; }
          if (!nsitfNin.trim() || nsitfNin.trim().length !== 11) { setError('NSITF NIN must be exactly 11 digits.'); return false; }
          if (!nsitfEmail.trim() || !isValidEmail(nsitfEmail)) { setError('NSITF valid Email is required.'); return false; }
          if (!nsitfNokName.trim()) { setError('NSITF Next of Kin name is required.'); return false; }
          if (!nsitfNokPhone.trim()) { setError('NSITF Next of Kin phone number is required.'); return false; }
          if (!nsitfNokRelationship.trim()) { setError('NSITF Next of Kin relationship is required.'); return false; }
          if (!nsitfCompanyAddress.trim()) { setError('NSITF Company address is required.'); return false; }
          if (!nsitfCompanyEmail.trim() || !isValidEmail(nsitfCompanyEmail)) { setError('NSITF valid Company email is required.'); return false; }
          if (!nsitfCompanyPhone.trim()) { setError('NSITF Company phone is required.'); return false; }
          if (nsitfStaffList.length < 3) { setError('NSITF requires a minimum of 3 Staff.'); return false; }
          for (let idx = 0; idx < nsitfStaffList.length; idx++) {
            const staff = nsitfStaffList[idx];
            if (!staff.name.trim()) { setError(`NSITF Staff #${idx + 1} Name is required.`); return false; }
            if (!staff.designation.trim()) { setError(`NSITF Staff #${idx + 1} Designation is required.`); return false; }
            if (!staff.phone.trim()) { setError(`NSITF Staff #${idx + 1} Phone Number is required.`); return false; }
          }
        }
        if (selectedComplianceServices.includes('SCUML')) {
          if (!scumlCompanyName.trim()) { setError('SCUML Company name is required.'); return false; }
          if (!scumlRcNumber.trim()) { setError('SCUML Company RC/BN is required.'); return false; }
          if (!scumlIncDate.trim()) { setError('SCUML Date of incorporation is required.'); return false; }
          if (!scumlCompanyAddress.trim()) { setError('SCUML Company address is required.'); return false; }
          if (!scumlTin.trim()) { setError('SCUML TIN number is required.'); return false; }
          if (!scumlDirectorName.trim()) { setError('SCUML Director full name is required.'); return false; }
          if (!scumlDirectorEmail.trim() || !isValidEmail(scumlDirectorEmail)) { setError('SCUML valid Director email is required.'); return false; }
          if (!scumlDirectorPhone.trim()) { setError('SCUML Director Phone number is required.'); return false; }
          if (!scumlBankName.trim()) { setError('SCUML Bank name is required.'); return false; }
          if (!scumlBankAccount.trim()) { setError('SCUML Account number is required.'); return false; }
          if (!scumlNin.trim() || scumlNin.trim().length !== 11) { setError('SCUML NIN must be exactly 11 digits.'); return false; }
          if (!scumlDob.trim()) { setError('SCUML Date of birth is required.'); return false; }
          if (!scumlBvn.trim() || scumlBvn.trim().length !== 11) { setError('SCUML BVN must be exactly 11 digits.'); return false; }
        }
        if (selectedComplianceServices.includes('TIN Validation')) {
          if (!tvCompanyName.trim()) { setError('TIN Validation Company/Business Name is required.'); return false; }
          if (!tvRcNumber.trim()) { setError('TIN Validation RC/BN number is required.'); return false; }
          if (!tvTin.trim()) { setError('TIN Validation FIRS TIN number is required.'); return false; }
          if (!tvNatureOfBusiness.trim()) { setError('TIN Validation Line of Business is required.'); return false; }
          if (!tvCompanyAddress.trim()) { setError('TIN Validation Company address is required.'); return false; }
          if (!tvCompanyPhone.trim()) { setError('TIN Validation Company phone is required.'); return false; }
          if (!tvCompanyEmail.trim() || !isValidEmail(tvCompanyEmail)) { setError('TIN Validation valid Company email is required.'); return false; }
          if (!tvCommencementDate.trim()) { setError('TIN Validation Commencement date is required.'); return false; }
          if (!tvAccountingYearEnd.trim()) { setError('TIN Validation Accounting Year End is required.'); return false; }
          if (!tvAuthorizedPerson.trim()) { setError('TIN Validation Name of Authorized Person(s) is required.'); return false; }
          if (!tvDirectorEmail.trim() || !isValidEmail(tvDirectorEmail)) { setError('TIN Validation valid Director email is required.'); return false; }
          if (!tvDirectorPhone.trim()) { setError('TIN Validation Director phone is required.'); return false; }
        }
        if (selectedComplianceServices.includes('ITF')) {
          if (!itfCompanyAddress.trim()) { setError('ITF Address is required.'); return false; }
          if (!itfEmail.trim() || !isValidEmail(itfEmail)) { setError('ITF valid email is required.'); return false; }
          if (!itfPhone.trim()) { setError('ITF Phone number is required.'); return false; }
          if (!itfTin.trim()) { setError('ITF TIN number is required.'); return false; }
        }
        const activeDefaults = selectedComplianceServices.filter(s => !['NSITF', 'SCUML', 'TIN Validation', 'ITF'].includes(s));
        if (activeDefaults.length > 0) {
          if (!firstName.trim()) { setError('Contact Person First name is required.'); return false; }
          if (!surname.trim()) { setError('Contact Person Surname is required.'); return false; }
          if (!partyPhone.trim()) { setError('Contact Person Phone is required.'); return false; }
          if (!partyEmail.trim() || !isValidEmail(partyEmail)) { setError('Contact Person valid Email is required.'); return false; }
          if (!compAddress.trim()) { setError('Company / Business Address is required.'); return false; }
        }
      } else if (selectedService === 'other_services') {
        if (selectedOtherServices.includes('Trademark Registration')) {
          if (!tmProposedName.trim()) { setError('Trademark Proposed Name is required.'); return false; }
          if (!tmSurname.trim()) { setError('Trademark Surname is required.'); return false; }
          if (!tmFirstName.trim()) { setError('Trademark First Name is required.'); return false; }
          if (!tmAddress.trim()) { setError('Trademark Business/Company Address is required.'); return false; }
          if (!tmBusinessClass.trim()) { setError('Trademark Class of Business is required.'); return false; }
          if (!tmPhone.trim()) { setError('Trademark Phone Number is required.'); return false; }
          if (!tmCompanyName.trim()) { setError('Trademark Business/Company Name is required.'); return false; }
          if (!tmEmail.trim() || !isValidEmail(tmEmail)) { setError('Trademark valid Email is required.'); return false; }
        }
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
      const requiredDocs = ['Signature', 'NIN slip', 'CAC document', 'company letter head'];
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
        details: detailsText,
        trademarkDetails: selectedOtherServices.includes('Trademark Registration') ? {
          proposedName: tmProposedName,
          surname: tmSurname,
          firstName: tmFirstName,
          middleName: tmMiddleName,
          address: tmAddress,
          businessClass: tmBusinessClass,
          phone: tmPhone,
          companyName: tmCompanyName,
          email: tmEmail
        } : undefined
      };
    } else {
      detailsObj = {
        rcNumber,
        selectedSubServices: selectedComplianceServices,
        details: detailsText,
        nsitfDetails: selectedComplianceServices.includes('NSITF') ? {
          fullName: nsitfFullName,
          maritalStatus: nsitfMaritalStatus,
          dob: nsitfDob,
          residentialAddress: nsitfResAddress,
          stateOfOrigin: nsitfStateOfOrigin,
          lgaOfOrigin: nsitfLgaOfOrigin,
          phone: nsitfPhone,
          nin: nsitfNin,
          email: nsitfEmail,
          dependentsCount: nsitfDependentsCount,
          nextOfKin: {
            name: nsitfNokName,
            phone: nsitfNokPhone,
            relationship: nsitfNokRelationship
          },
          companyAddress: nsitfCompanyAddress,
          companyEmail: nsitfCompanyEmail,
          companyPhone: nsitfCompanyPhone,
          staffList: nsitfStaffList
        } : undefined,
        scumlDetails: selectedComplianceServices.includes('SCUML') ? {
          companyName: scumlCompanyName,
          rcNumber: scumlRcNumber,
          incorporationDate: scumlIncDate,
          companyAddress: scumlCompanyAddress,
          tin: scumlTin,
          director: {
            fullName: scumlDirectorName,
            email: scumlDirectorEmail,
            phone: scumlDirectorPhone,
            nin: scumlNin,
            dob: scumlDob,
            bvn: scumlBvn,
            gender: scumlGender
          },
          bankName: scumlBankName,
          accountNumber: scumlBankAccount
        } : undefined,
        tinValidationDetails: selectedComplianceServices.includes('TIN Validation') ? {
          companyName: tvCompanyName,
          rcNumber: tvRcNumber,
          tin: tvTin,
          natureOfBusiness: tvNatureOfBusiness,
          companyAddress: tvCompanyAddress,
          companyPhone: tvCompanyPhone,
          companyEmail: tvCompanyEmail,
          commencementDate: tvCommencementDate,
          accountingYearEnd: tvAccountingYearEnd,
          authorizedPerson: tvAuthorizedPerson,
          directorEmail: tvDirectorEmail,
          directorPhone: tvDirectorPhone
        } : undefined,
        itfDetails: selectedComplianceServices.includes('ITF') ? {
          companyAddress: itfCompanyAddress,
          email: itfEmail,
          phone: itfPhone,
          tin: itfTin
        } : undefined
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
      const uploadedFilesList: { name: string; size: number; category?: string }[] = [];

      // 2. Loop and upload files sequentially
      if (['post_incorporation', 'compliance', 'other_services'].includes(selectedService)) {
        if (['post_incorporation', 'other_services'].includes(selectedService)) {
          const activeSubServices = selectedService === 'post_incorporation' ? selectedSubServices : selectedOtherServices;
          for (const sub of activeSubServices) {
            if (selectedService === 'other_services' && sub === 'Trademark Registration') {
              const trademarkDocs = ["CAC Certificate", "Company Logo", "Director's Signature"];
              for (const docType of trademarkDocs) {
                const files = complianceRequiredFiles[docType] || [];
                for (const file of files) {
                  const formData = new FormData();
                  const renamedFile = new File([file], `[${sub} - ${docType}] ${file.name}`, { type: file.type });
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
                  uploadedFilesList.push({ name: file.name, size: file.size, category: `${sub} - ${docType}` });
                }
              }
            } else {
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
                uploadedFilesList.push({ name: file.name, size: file.size, category: sub });
              }
            }
          }
        } else {
          // compliance
          const requiredDocs = getComplianceRequiredDocs();
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
              uploadedFilesList.push({ name: file.name, size: file.size, category: docType });
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
          uploadedFilesList.push({ name: file.name, size: file.size, category: 'Supporting File' });
        }
      }

      setSuccessMsg(`Service application submitted successfully! Reference ID: #${newAppId}`);
      
      // Trigger Upload Result Pop Up Modal FIRST (Survey comes up after user acknowledges upload result!)
      setUploadResultModal({
        success: true,
        message: `Application #${newAppId} submitted successfully! ${uploadedFilesList.length > 0 ? `${uploadedFilesList.length} document(s) uploaded and attached.` : 'No file attachments needed.'}`,
        files: uploadedFilesList,
        appId: newAppId,
        triggerSurvey: true
      });
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
      setUploadResultModal({
        success: false,
        message: err.message || 'Document upload or application submission failed. Please check your attachments and try again.',
        files: [],
        triggerSurvey: false
      });
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
                                  <option value="Share Capital Allotment">Share Capital Allotment / Return of Allotment</option>
                                  <option value="Increase Share Capital">Increase in Share Capital</option>
                                  <option value="Increase & Allotment of Shares">Increase & Allotment of Shares</option>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {selectedComplianceServices.map((subService) => {
                      if (subService === 'NSITF') {
                        return (
                          <div key={subService} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderColor: 'rgba(215, 25, 32, 0.15)' }}>
                            <h4 style={{ color: 'var(--accent-red)', fontSize: '1.05rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: 0 }}>
                              NSITF Requirement Form
                            </h4>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*Full Name:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Babajide Sowande"
                                  className="form-input"
                                  value={nsitfFullName}
                                  onChange={(e) => setNsitfFullName(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Marital Status:*</label>
                                <select 
                                  className="form-select"
                                  value={nsitfMaritalStatus}
                                  onChange={(e) => setNsitfMaritalStatus(e.target.value)}
                                >
                                  <option value="Single">Single</option>
                                  <option value="Married">Married</option>
                                  <option value="Divorced">Divorced</option>
                                  <option value="Widowed">Widowed</option>
                                </select>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*Date of Birth:*</label>
                                <input
                                  type="date"
                                  required
                                  max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                  className="form-input"
                                  value={nsitfDob}
                                  onChange={(e) => setNsitfDob(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Phone Number:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. +234 803 123 4567"
                                  className="form-input"
                                  value={nsitfPhone}
                                  onChange={(e) => setNsitfPhone(e.target.value)}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*State of Origin:*</label>
                                <select
                                  required
                                  className="form-select"
                                  value={nsitfStateOfOrigin}
                                  onChange={(e) => {
                                    setNsitfStateOfOrigin(e.target.value);
                                    setNsitfLgaOfOrigin('');
                                  }}
                                >
                                  <option value="">Select State</option>
                                  {Object.keys(NIGERIA_STATES_AND_LGAS).map(st => (
                                    <option key={st} value={st}>{st}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Local Govt (LGA) of Origin:*</label>
                                <select
                                  required
                                  className="form-select"
                                  value={nsitfLgaOfOrigin}
                                  onChange={(e) => setNsitfLgaOfOrigin(e.target.value)}
                                  disabled={!nsitfStateOfOrigin}
                                >
                                  <option value="">Select LGA</option>
                                  {nsitfStateOfOrigin && NIGERIA_STATES_AND_LGAS[nsitfStateOfOrigin]?.map(lg => (
                                    <option key={lg} value={lg}>{lg}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*NIN Number:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. 12345678901"
                                  className="form-input"
                                  value={nsitfNin}
                                  onChange={(e) => setNsitfNin(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Email Address:*</label>
                                <input
                                  type="email"
                                  required
                                  placeholder="e.g. client@domain.com"
                                  className="form-input"
                                  value={nsitfEmail}
                                  onChange={(e) => setNsitfEmail(e.target.value)}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*Number of Dependents:*</label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  className="form-input"
                                  value={nsitfDependentsCount}
                                  onChange={(e) => setNsitfDependentsCount(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Residential Address:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. 10 Garki St, Abuja"
                                  className="form-input"
                                  value={nsitfResAddress}
                                  onChange={(e) => setNsitfResAddress(e.target.value)}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                              <div className="form-group">
                                <label className="form-label">*Next of Kin Name:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Jane Sowande"
                                  className="form-input"
                                  value={nsitfNokName}
                                  onChange={(e) => setNsitfNokName(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Next of Kin Phone:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. +234 809 999 8888"
                                  className="form-input"
                                  value={nsitfNokPhone}
                                  onChange={(e) => setNsitfNokPhone(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Next of Kin Relationship:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Spouse"
                                  className="form-input"
                                  value={nsitfNokRelationship}
                                  onChange={(e) => setNsitfNokRelationship(e.target.value)}
                                />
                              </div>
                            </div>

                            <h5 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '700', marginTop: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
                              Company Details
                            </h5>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                              <div className="form-group">
                                <label className="form-label">*Company Address:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. 5 Main St, Lagos"
                                  className="form-input"
                                  value={nsitfCompanyAddress}
                                  onChange={(e) => setNsitfCompanyAddress(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Company Email:*</label>
                                <input
                                  type="email"
                                  required
                                  placeholder="e.g. office@company.com"
                                  className="form-input"
                                  value={nsitfCompanyEmail}
                                  onChange={(e) => setNsitfCompanyEmail(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Company Phone:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. +234 812 345 6789"
                                  className="form-input"
                                  value={nsitfCompanyPhone}
                                  onChange={(e) => setNsitfCompanyPhone(e.target.value)}
                                />
                              </div>
                            </div>

                            <h5 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '700', marginTop: '12px', marginBottom: '4px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Staff Details (Minimum 3 Required)</span>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                                onClick={() => setNsitfStaffList(prev => [...prev, { name: '', designation: '', phone: '' }])}
                              >
                                + Add Staff Option
                              </button>
                            </h5>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {nsitfStaffList.map((staff, staffIdx) => (
                                <div key={staffIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.7rem' }}>*Staff #{staffIdx + 1} Name:*</label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="Full Name"
                                      className="form-input"
                                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                      value={staff.name}
                                      onChange={(e) => {
                                        const newList = [...nsitfStaffList];
                                        newList[staffIdx].name = e.target.value;
                                        setNsitfStaffList(newList);
                                      }}
                                    />
                                  </div>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.7rem' }}>*Designation:*</label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="Position"
                                      className="form-input"
                                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                      value={staff.designation}
                                      onChange={(e) => {
                                        const newList = [...nsitfStaffList];
                                        newList[staffIdx].designation = e.target.value;
                                        setNsitfStaffList(newList);
                                      }}
                                    />
                                  </div>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.7rem' }}>*Phone Number:*</label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="Phone"
                                      className="form-input"
                                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                      value={staff.phone}
                                      onChange={(e) => {
                                        const newList = [...nsitfStaffList];
                                        newList[staffIdx].phone = e.target.value;
                                        setNsitfStaffList(newList);
                                      }}
                                    />
                                  </div>
                                  {nsitfStaffList.length > 3 && (
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      style={{ padding: '8px', color: 'var(--accent-red)', border: '1px solid rgba(215,25,32,0.2)', margin: 0 }}
                                      onClick={() => setNsitfStaffList(prev => prev.filter((_, idx) => idx !== staffIdx))}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (subService === 'SCUML') {
                        return (
                          <div key={subService} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderColor: 'rgba(215, 25, 32, 0.15)' }}>
                            <h4 style={{ color: 'var(--accent-red)', fontSize: '1.05rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: 0 }}>
                              SCUML Requirement Form
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*Company Name:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Company Name"
                                  className="form-input"
                                  value={scumlCompanyName}
                                  onChange={(e) => setScumlCompanyName(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Company RC/BN:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Company RC/BN"
                                  className="form-input"
                                  value={scumlRcNumber}
                                  onChange={(e) => setScumlRcNumber(e.target.value)}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*Date of Incorporation:*</label>
                                <input
                                  type="date"
                                  required
                                  max={new Date().toISOString().split('T')[0]}
                                  className="form-input"
                                  value={scumlIncDate}
                                  onChange={(e) => setScumlIncDate(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*TIN No:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="TIN No"
                                  className="form-input"
                                  value={scumlTin}
                                  onChange={(e) => setScumlTin(e.target.value)}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                              <div className="form-group">
                                <label className="form-label">*Director Full Name:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Director Full Name"
                                  className="form-input"
                                  value={scumlDirectorName}
                                  onChange={(e) => setScumlDirectorName(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Active Director Email:*</label>
                                <input
                                  type="email"
                                  required
                                  placeholder="Director Email"
                                  className="form-input"
                                  value={scumlDirectorEmail}
                                  onChange={(e) => setScumlDirectorEmail(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Director Phone No:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Director Phone"
                                  className="form-input"
                                  value={scumlDirectorPhone}
                                  onChange={(e) => setScumlDirectorPhone(e.target.value)}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*Bank Name:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Bank Name"
                                  className="form-input"
                                  value={scumlBankName}
                                  onChange={(e) => setScumlBankName(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Account Number:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Account Number"
                                  className="form-input"
                                  value={scumlBankAccount}
                                  onChange={(e) => setScumlBankAccount(e.target.value)}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                              <div className="form-group">
                                <label className="form-label">*NIN:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="NIN Number"
                                  className="form-input"
                                  value={scumlNin}
                                  onChange={(e) => setScumlNin(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Date of Birth:*</label>
                                <input
                                  type="date"
                                  required
                                  max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                  className="form-input"
                                  value={scumlDob}
                                  onChange={(e) => setScumlDob(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*BVN:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="BVN Number"
                                  className="form-input"
                                  value={scumlBvn}
                                  onChange={(e) => setScumlBvn(e.target.value)}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*Gender:*</label>
                                <select 
                                  className="form-select"
                                  value={scumlGender}
                                  onChange={(e) => setScumlGender(e.target.value)}
                                >
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Company Address:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Company Address"
                                  className="form-input"
                                  value={scumlCompanyAddress}
                                  onChange={(e) => setScumlCompanyAddress(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (subService === 'TIN Validation') {
                        return (
                          <div key={subService} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderColor: 'rgba(215, 25, 32, 0.15)' }}>
                            <h4 style={{ color: 'var(--accent-red)', fontSize: '1.05rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: 0 }}>
                              TIN Validation on Tax Promax Form
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*Company/Business Name:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Company/Business Name"
                                  className="form-input"
                                  value={tvCompanyName}
                                  onChange={(e) => setTvCompanyName(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*RC/BN Number:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="RC/BN Number"
                                  className="form-input"
                                  value={tvRcNumber}
                                  onChange={(e) => setTvRcNumber(e.target.value)}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*FIRS TIN Number:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="FIRS TIN Number"
                                  className="form-input"
                                  value={tvTin}
                                  onChange={(e) => setTvTin(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Nature of Business:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Line of Business"
                                  className="form-input"
                                  value={tvNatureOfBusiness}
                                  onChange={(e) => setTvNatureOfBusiness(e.target.value)}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*Company Phone Number:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Company Phone"
                                  className="form-input"
                                  value={tvCompanyPhone}
                                  onChange={(e) => setTvCompanyPhone(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Company Email Address:*</label>
                                <input
                                  type="email"
                                  required
                                  placeholder="Company Email"
                                  className="form-input"
                                  value={tvCompanyEmail}
                                  onChange={(e) => setTvCompanyEmail(e.target.value)}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*Commencement Date:*</label>
                                <input
                                  type="date"
                                  required
                                  max={new Date().toISOString().split('T')[0]}
                                  className="form-input"
                                  value={tvCommencementDate}
                                  onChange={(e) => setTvCommencementDate(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Accounting Year End:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. December 31"
                                  className="form-input"
                                  value={tvAccountingYearEnd}
                                  onChange={(e) => setTvAccountingYearEnd(e.target.value)}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                              <div className="form-group">
                                <label className="form-label">*Authorized Person(s):*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Name of Authorized Person"
                                  className="form-input"
                                  value={tvAuthorizedPerson}
                                  onChange={(e) => setTvAuthorizedPerson(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Director Email:*</label>
                                <input
                                  type="email"
                                  required
                                  placeholder="Director Email"
                                  className="form-input"
                                  value={tvDirectorEmail}
                                  onChange={(e) => setTvDirectorEmail(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Director Phone:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Director Phone"
                                  className="form-input"
                                  value={tvDirectorPhone}
                                  onChange={(e) => setTvDirectorPhone(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="form-group">
                              <label className="form-label">*Company Address:*</label>
                              <input
                                type="text"
                                required
                                placeholder="Office Address"
                                className="form-input"
                                value={tvCompanyAddress}
                                onChange={(e) => setTvCompanyAddress(e.target.value)}
                              />
                            </div>
                          </div>
                        );
                      }

                      if (subService === 'ITF') {
                        return (
                          <div key={subService} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderColor: 'rgba(215, 25, 32, 0.15)' }}>
                            <h4 style={{ color: 'var(--accent-red)', fontSize: '1.05rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: 0 }}>
                              ITF Requirement Form
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*Active Email Address:*</label>
                                <input
                                  type="email"
                                  required
                                  placeholder="Active Email"
                                  className="form-input"
                                  value={itfEmail}
                                  onChange={(e) => setItfEmail(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Phone Number:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Phone Number"
                                  className="form-input"
                                  value={itfPhone}
                                  onChange={(e) => setItfPhone(e.target.value)}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div className="form-group">
                                <label className="form-label">*TIN Number:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="TIN Number"
                                  className="form-input"
                                  value={itfTin}
                                  onChange={(e) => setItfTin(e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">*Company Address:*</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Company Address"
                                  className="form-input"
                                  value={itfCompanyAddress}
                                  onChange={(e) => setItfCompanyAddress(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Default compliance form for Pencom, TCC, BPP, etc.
                      return (
                        <div key={subService} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                          <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: 0 }}>
                            {subService} Requirement Details
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                              <label className="form-label">*Contact Person Full Name:*</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Babajide Sowande"
                                className="form-input"
                                value={firstName}
                                onChange={(e) => { setFirstName(e.target.value); setSurname('Compliance'); }}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">*Phone Number:*</label>
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
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                              <label className="form-label">*Email Address:*</label>
                              <input
                                type="email"
                                required
                                placeholder="e.g. rep@company.com"
                                className="form-input"
                                value={partyEmail}
                                onChange={(e) => setPartyEmail(e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">*NIN or BVN:*</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. 12345678901"
                                className="form-input"
                                value={compBvn}
                                onChange={(e) => { setCompBvn(e.target.value); setCompNin(e.target.value); }}
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">*Company / Business Address:*</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 15 Garki Road, Abuja"
                              className="form-input"
                              value={compAddress}
                              onChange={(e) => setCompAddress(e.target.value)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedService === 'other_services' && selectedOtherServices.includes('Trademark Registration') && (
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderColor: 'rgba(215, 25, 32, 0.15)', marginBottom: '16px' }}>
                    <h4 style={{ color: 'var(--accent-red)', fontSize: '1.05rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: 0 }}>
                      Trademark Requirement Form
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">*Proposed Trademark Name:*</label>
                        <input
                          type="text"
                          required
                          placeholder="Proposed Trademark Name"
                          className="form-input"
                          value={tmProposedName}
                          onChange={(e) => setTmProposedName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">*Business/Company Name:*</label>
                        <input
                          type="text"
                          required
                          placeholder="Business/Company Name"
                          className="form-input"
                          value={tmCompanyName}
                          onChange={(e) => setTmCompanyName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">*Surname:*</label>
                        <input
                          type="text"
                          required
                          placeholder="Surname"
                          className="form-input"
                          value={tmSurname}
                          onChange={(e) => setTmSurname(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">*First Name:*</label>
                        <input
                          type="text"
                          required
                          placeholder="First Name"
                          className="form-input"
                          value={tmFirstName}
                          onChange={(e) => setTmFirstName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Middle Name:</label>
                        <input
                          type="text"
                          placeholder="Middle Name"
                          className="form-input"
                          value={tmMiddleName}
                          onChange={(e) => setTmMiddleName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">*Class of Business:*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Class 35"
                          className="form-input"
                          value={tmBusinessClass}
                          onChange={(e) => setTmBusinessClass(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">*Phone Number:*</label>
                        <input
                          type="text"
                          required
                          placeholder="Phone Number"
                          className="form-input"
                          value={tmPhone}
                          onChange={(e) => setTmPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">*Email Address:*</label>
                        <input
                          type="email"
                          required
                          placeholder="Email Address"
                          className="form-input"
                          value={tmEmail}
                          onChange={(e) => setTmEmail(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">*Business/Company Address:*</label>
                        <input
                          type="text"
                          required
                          placeholder="Business/Company Address"
                          className="form-input"
                          value={tmAddress}
                          onChange={(e) => setTmAddress(e.target.value)}
                        />
                      </div>
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
                          ? 'national ID card, NIN slip, or valid identity document.' 
                          : 'international passport, driver licence, national ID card, voter card.'
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
                      ? selectedSubServices.map(sub => ({ key: sub, label: sub, isCompliance: false }))
                      : selectedService === 'other_services'
                        ? getOtherRequiredDocsList().map(item => ({ key: item.key, label: item.label, isCompliance: item.isCustom }))
                        : getComplianceRequiredDocs().map(doc => ({ key: doc, label: doc, isCompliance: true }))
                    ).map((item) => {
                      const sub = item.key;
                      const isComp = item.isCompliance;
                      const files = (isComp
                        ? complianceRequiredFiles[sub]
                        : subServiceFiles[sub]) || [];
                      return (
                        <div key={item.label} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>
                              {item.label} {isComp ? '(Required)' : 'Documents'}
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
                                  if (isComp) {
                                    setComplianceRequiredFiles(prev => ({
                                      ...prev,
                                      [sub]: [...(prev[sub] || []), ...validFiles]
                                    }));
                                  } else {
                                    setSubServiceFiles(prev => ({
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
                                        if (isComp) {
                                          setComplianceRequiredFiles(prev => ({
                                            ...prev,
                                            [sub]: (prev[sub] || []).filter((_, i) => i !== fileIdx)
                                          }));
                                        } else {
                                          setSubServiceFiles(prev => ({
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

      {/* ── UPLOAD RESULT POPUP MODAL ───────────────────────────────────── */}
      {uploadResultModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            borderRadius: '16px',
            textAlign: 'left',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            border: uploadResultModal.success ? '1px solid rgba(72,187,120,0.4)' : '1px solid rgba(252,129,129,0.4)',
            background: '#0D1B2A',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {uploadResultModal.success ? (
                  <CheckCircle2 size={28} style={{ color: '#48bb78' }} />
                ) : (
                  <AlertCircle size={28} style={{ color: '#fc8181' }} />
                )}
                <div>
                  <h3 style={{ color: '#fff', fontSize: '1.2rem', margin: 0, fontWeight: '700' }}>
                    {uploadResultModal.success ? 'Upload Status: Successful' : 'Upload Status: Unsuccessful'}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {uploadResultModal.appId ? `Filing Application #${uploadResultModal.appId}` : 'Document Attachment Notification'}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  const trigger = uploadResultModal.triggerSurvey;
                  setUploadResultModal(null);
                  if (trigger) setShowSurveyModal(true);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: uploadResultModal.success ? '#e2e8f0' : '#fc8181', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
              {uploadResultModal.message}
            </p>

            {uploadResultModal.files && uploadResultModal.files.length > 0 && (
              <div style={{ padding: '14px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Uploaded Files ({uploadResultModal.files.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                  {uploadResultModal.files.map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#fff', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} style={{ color: 'var(--accent-red)' }} />
                        {f.category ? `[${f.category}] ` : ''}{f.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#48bb78', fontWeight: '600' }}>
                        {(f.size / 1024).toFixed(1)} KB ✓
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  const trigger = uploadResultModal.triggerSurvey;
                  setUploadResultModal(null);
                  if (trigger) setShowSurveyModal(true);
                }}
                className="btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.85rem' }}
              >
                {uploadResultModal.triggerSurvey ? 'Proceed to Feedback' : 'Acknowledge & Close'}
              </button>
            </div>
          </div>
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
