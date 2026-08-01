// USAS API Service Layer
// Dual JSON & Form-UrlEncoded transport layer with multi-endpoint fallback

const BASE_URL = '/api/usas';
const API_KEY = '123';
const UMC_VERSION = '2.0.3';
const PLATFORM = 'Android';
const DUMMY_TOKEN = 'dummytoken';

// Mock data for Demo Mode
export const MOCK_STUDENT_DATA = {
  user_id: 'AI210042',
  name: 'AHMAD AMIRUL BIN ROSLI',
  program: 'BACHELOR OF COMPUTER SCIENCE (HONS)',
  semester: 'Semester 1 2024/2025',
  financialBalance: 'RM 0.00 (Lunas)',
  timetableDays: ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'],
  timetable: [
    {
      id: '1',
      day: 'ISNIN',
      course_id: 'CSC2103',
      course_name: 'DATA STRUCTURES AND ALGORITHMS',
      group: 'GRP01',
      start_time: '08:30 AM',
      end_time: '10:30 AM',
      location: 'Makmal Komputer 3 (MK3)',
      lecturer: 'DR. NORAZLINA BINTI ABDUL RAHMAN',
      kehadiran: '88%',
      catatan: 'Dewan Kuliah Blok B'
    },
    {
      id: '2',
      day: 'ISNIN',
      course_id: 'SEC3303',
      course_name: 'CYBERSECURITY FUNDAMENTALS',
      group: 'GRP01',
      start_time: '11:00 AM',
      end_time: '01:00 PM',
      location: 'Dewan Kuliah 2 (DK2)',
      lecturer: 'PM DR. MOHD FAIZAL BIN KASIM',
      kehadiran: '95%',
      catatan: 'Bring your laptop'
    },
    {
      id: '3',
      day: 'SELASA',
      course_id: 'BIT2043',
      course_name: 'WEB APPLICATION DEVELOPMENT',
      group: 'GRP02',
      start_time: '09:00 AM',
      end_time: '12:00 PM',
      location: 'Makmal Software Engineering',
      lecturer: 'EN. MUHAMMAD HAZIM BIN ISMAIL',
      kehadiran: '100%',
      catatan: 'Lab session & assessment'
    },
    {
      id: '4',
      day: 'SELASA',
      course_id: 'MPU3113',
      course_name: 'HUBUNGAN ETNIK',
      group: 'GRP01',
      start_time: '02:30 PM',
      end_time: '04:30 PM',
      location: 'Dewan Besar USAS',
      lecturer: 'USTAZ AHMAD SHAFIQ BIN ZAINAL',
      kehadiran: '92%',
      catatan: 'Lecture'
    },
    {
      id: '5',
      day: 'RABU',
      course_id: 'CSC3203',
      course_name: 'DATABASE SYSTEMS & BIG DATA',
      group: 'GRP01',
      start_time: '08:30 AM',
      end_time: '11:30 AM',
      location: 'Makmal Komputer 1 (MK1)',
      lecturer: 'PN. SITI NURHALIZA BINTI OTHMAN',
      kehadiran: '90%',
      catatan: 'Practical SQL exercise'
    },
    {
      id: '6',
      day: 'RABU',
      course_id: 'SEC3403',
      course_name: 'ETHICAL HACKING & PENETRATION TESTING',
      group: 'GRP01',
      start_time: '02:00 PM',
      end_time: '05:00 PM',
      location: 'Cyber Security Lab (CSL)',
      lecturer: 'PM DR. MOHD FAIZAL BIN KASIM',
      kehadiran: '96%',
      catatan: 'Hands-on lab setup'
    },
    {
      id: '7',
      day: 'KHAMIS',
      course_id: 'CSC2103',
      course_name: 'DATA STRUCTURES AND ALGORITHMS',
      group: 'GRP01',
      start_time: '10:00 AM',
      end_time: '12:00 PM',
      location: 'Dewan Kuliah 1 (DK1)',
      lecturer: 'DR. NORAZLINA BINTI ABDUL RAHMAN',
      kehadiran: '88%',
      catatan: 'Tutorial & Q&A'
    },
    {
      id: '8',
      day: 'JUMAAT',
      course_id: 'BIT3903',
      course_name: 'FINAL YEAR PROJECT 1',
      group: 'GRP01',
      start_time: '09:00 AM',
      end_time: '11:30 AM',
      location: 'Bilik Mesyuarat FTMK',
      lecturer: 'DR. KHALID BIN HASSAN',
      kehadiran: '100%',
      catatan: 'Progress presentation with supervisor'
    }
  ]
};

// Robust HTTP POST helper for USAS backend
async function postUSAS(endpoint, payload) {
  // 1. Try application/json
  try {
    const jsonRes = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (jsonRes.ok) {
      const text = await jsonRes.text();
      if (text && !text.startsWith('Access Denied') && text.includes('{')) {
        try {
          const data = JSON.parse(text);
          if (data) return data;
        } catch (e) {}
      }
    }
  } catch (err) {}

  // 2. Fallback to application/x-www-form-urlencoded
  try {
    const formParams = new URLSearchParams();
    Object.keys(payload).forEach(key => {
      if (payload[key] !== undefined && payload[key] !== null) {
        formParams.append(key, payload[key]);
      }
    });

    const formRes = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formParams.toString()
    });
    if (formRes.ok) {
      const formText = await formRes.text();
      if (formText && !formText.startsWith('Access Denied') && formText.includes('{')) {
        return JSON.parse(formText);
      }
    }
  } catch (err) {}

  return null;
}

export async function loginStudentAPI(userId, password, isDemo = false) {
  if (isDemo || userId.toLowerCase() === 'demo') {
    return {
      success: true,
      data: {
        status: 1,
        message: "Demo Login Successful",
        user_id: MOCK_STUDENT_DATA.user_id,
        sid_1: "demo_sid_1_token_sample",
        sid_2: "demo_sid_2_token_sample",
        sid_3: "demo_sid_3_token_sample",
        isDemo: true
      }
    };
  }

  const payload = {
    request_type: "login",
    user_id: userId,
    password: password,
    umc_version: UMC_VERSION,
    platform: PLATFORM
  };

  const result = await postUSAS('/student/login_student.php', payload);

  if (result && result.server_response && result.server_response.length > 0) {
    const resp = result.server_response[0];
    if (resp.status === 1 || resp.status === "1") {
      return {
        success: true,
        data: {
          status: 1,
          user_id: userId,
          sid_1: resp.sid_1,
          sid_2: resp.sid_2,
          sid_3: resp.sid_3,
          isDemo: false
        }
      };
    } else {
      return {
        success: false,
        error: resp.message || "Log masuk gagal. Sila semak No. Matrik dan Kata Laluan."
      };
    }
  }

  return {
    success: false,
    error: "Log masuk gagal atau respons pelayan tidak sah. Sila semak No. Matrik & Kata Laluan."
  };
}

export async function fetchStudentProfileAPI(session) {
  if (session.isDemo) {
    return {
      name: MOCK_STUDENT_DATA.name,
      program: MOCK_STUDENT_DATA.program,
      financialBalance: MOCK_STUDENT_DATA.financialBalance
    };
  }

  const payload = {
    apiKey: API_KEY,
    request_type: "student_profile",
    user_id: session.user_id,
    token: DUMMY_TOKEN,
    sid_1: session.sid_1,
    sid_2: session.sid_2,
    sid_3: session.sid_3,
    umc_platform: PLATFORM,
    umc_version: UMC_VERSION
  };

  const result = await postUSAS('/student/get_student_profile.php', payload);
  let name = null;
  let program = null;

  if (result) {
    if (result.server_response_profil && Array.isArray(result.server_response_profil)) {
      for (const item of result.server_response_profil) {
        const label = (item.label || item.header_label || '').toLowerCase();
        const content = item.content || item.name || item.value || '';
        
        if (!name && (label.includes('name') || label.includes('nama') || label.includes('pelajar'))) {
          name = content;
        }
      }
      if (!name && result.server_response_profil[0]?.content) {
        name = result.server_response_profil[0].content;
      }
    }

    if (result.server_response_akademik && Array.isArray(result.server_response_akademik)) {
      for (const item of result.server_response_akademik) {
        const label = (item.label || '').toLowerCase();
        const content = item.content || item.value || '';
        if (!program && (label.includes('program') || label.includes('kursus') || label.includes('fakulti'))) {
          program = content;
        }
      }
      if (!program && result.server_response_akademik[0]?.content) {
        program = result.server_response_akademik[0].content;
      }
    }
  }

  return { 
    name: name && name.trim() ? name.trim() : null, 
    program: program && program.trim() ? program.trim() : null
  };
}

export async function fetchAttendanceHistoryAPI(session, groupId = 'GRP01') {
  if (session?.isDemo) {
    return [
      { minggu: 'Minggu 1', tarikh: '10-Oct-2024', status_hadir: 'Present', catatan: 'Scan QR App' },
      { minggu: 'Minggu 2', tarikh: '17-Oct-2024', status_hadir: 'Present', catatan: 'Scan QR App' },
      { minggu: 'Minggu 3', tarikh: '24-Oct-2024', status_hadir: 'Present', catatan: 'Scan QR App' },
      { minggu: 'Minggu 4', tarikh: '31-Oct-2024', status_hadir: 'Absent', catatan: 'Kenyataan Sebab (Sakit)' },
      { minggu: 'Minggu 5', tarikh: '07-Nov-2024', status_hadir: 'Present', catatan: 'Scan QR App' },
      { minggu: 'Minggu 6', tarikh: '14-Nov-2024', status_hadir: 'Present', catatan: 'Scan QR App' },
      { minggu: 'Minggu 7', tarikh: '21-Nov-2024', status_hadir: 'Present', catatan: 'Scan QR App' }
    ];
  }

  const payload = {
    apiKey: API_KEY,
    request_type: "laporan_kehadiran",
    group_id: groupId,
    user_id: session.user_id,
    token: DUMMY_TOKEN,
    sid_1: session.sid_1,
    sid_2: session.sid_2,
    sid_3: session.sid_3,
    umc_platform: PLATFORM,
    umc_version: UMC_VERSION
  };

  const res = await postUSAS('/student/get_kehadiran_kuliah.php', payload);
  if (res && res.server_response && Array.isArray(res.server_response)) {
    return res.server_response;
  }
  return [];
}

export async function fetchTimetableAPI(session) {
  if (session.isDemo) {
    return {
      success: true,
      days: MOCK_STUDENT_DATA.timetableDays,
      timetable: MOCK_STUDENT_DATA.timetable,
      studentName: MOCK_STUDENT_DATA.name,
      program: MOCK_STUDENT_DATA.program,
      semester: MOCK_STUDENT_DATA.semester
    };
  }

  const profilePromise = fetchStudentProfileAPI(session);

  const basePayload = {
    apiKey: API_KEY,
    user_id: session.user_id,
    token: DUMMY_TOKEN,
    sid_1: session.sid_1,
    sid_2: session.sid_2,
    sid_3: session.sid_3,
    umc_platform: PLATFORM,
    umc_version: UMC_VERSION
  };

  const timetablePayload = { ...basePayload, request_type: "jadual_kuliah" };
  const timetableRes = await postUSAS('/student/get_timetable_stud.php', timetablePayload);

  let rawItems = [];
  let rawDays = [];

  if (timetableRes && timetableRes.server_response && timetableRes.server_response.length > 0) {
    rawItems = timetableRes.server_response;
    rawDays = timetableRes.server_response_day || [];
  } else {
    const kehadiranPayload = { ...basePayload, request_type: "senarai_kursus" };
    const kehadiranRes = await postUSAS('/student/get_kehadiran_kuliah.php', kehadiranPayload);
    
    if (kehadiranRes && kehadiranRes.server_response && kehadiranRes.server_response.length > 0) {
      rawItems = kehadiranRes.server_response.map((item, i) => {
        let parsedDay = 'ISNIN';
        let parsedTime = item.jadual || 'Waktu ditetapkan';
        
        if (item.jadual) {
          const parts = item.jadual.trim().split(' ');
          const dayMap = {
            'MON': 'ISNIN', 'TUE': 'SELASA', 'WED': 'RABU', 'THU': 'KHAMIS', 'FRI': 'JUMAAT',
            'SAT': 'SABTU', 'SUN': 'AHAD',
            'ISNIN': 'ISNIN', 'SELASA': 'SELASA', 'RABU': 'RABU', 'KHAMIS': 'KHAMIS', 'JUMAAT': 'JUMAAT'
          };
          if (dayMap[parts[0]?.toUpperCase()]) {
            parsedDay = dayMap[parts[0].toUpperCase()];
            parsedTime = parts.slice(1).join(' ');
          }
        }

        return {
          id: item.id || String(i + 1),
          day: parsedDay,
          course_id: item.kod_kursus || `SUBJ${i + 1}`,
          course_name: item.kursus || 'Kursus USAS',
          group: item.kumpulan || item.group_id || 'GRP01',
          start_time: parsedTime,
          end_time: '',
          location: 'Dewan / Makmal USAS',
          lecturer: item.pensyarah || 'Pensyarah USAS',
          pelajar: item.pelajar,
          semester: item.semester,
          kehadiran: '85%',
          catatan: item.semester || ''
        };
      });
      rawDays = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];
    }
  }

  const profile = await profilePromise;

  let finalName = profile.name;
  let finalProgram = profile.program;

  if (!finalName && rawItems.length > 0) {
    for (const item of rawItems) {
      const candidate = item.pelajar || item.nama || item.student_name || item.name;
      if (candidate && candidate.trim() && candidate !== session.user_id) {
        finalName = candidate.trim();
        break;
      }
    }
  }

  const resultName = finalName || `Pelajar USAS (${session.user_id})`;
  const resultProgram = finalProgram || 'Program Pengajian USAS';
  const resultSemester = rawItems[0]?.semester || 'Semester Semasa';

  return {
    success: true,
    days: rawDays.length > 0 ? rawDays : ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'],
    timetable: rawItems,
    studentName: resultName,
    program: resultProgram,
    semester: resultSemester
  };
}
