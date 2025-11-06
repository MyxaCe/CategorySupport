let texts = {};
let tg = window.Telegram.WebApp;

// Инициализация Telegram WebApp
function initTelegramWebApp() {
    if (tg) {
        console.log('Telegram WebApp инициализирован');
        console.log('Platform:', tg.platform);
        console.log('Version:', tg.version);
        
        tg.expand(); // Расширяем WebApp на весь экран
        tg.ready(); // Сообщаем что WebApp готов
        
        // Настраиваем главную кнопку
        tg.MainButton.setText("ОТПРАВИТЬ");
        tg.MainButton.color = "#007bff";
        tg.MainButton.textColor = "#FFFFFF";
        
        // Показываем кнопку только когда форма заполнена
        tg.MainButton.hide();
        
        console.log('Telegram WebApp настроен');
        console.log('MainButton доступна:', !!tg.MainButton);
        return true;
    } else {
        console.log('Telegram WebApp недоступен - работаем в обычном режиме');
        return false;
    }
}

// Проверка заполненности формы
function checkFormCompleteness() {
    const mainReason = document.getElementById('mainReason')?.value;
    const additionalDetails = document.getElementById('additionalDetails')?.value;
    const description = document.getElementById('description')?.value.trim();
    
    const isComplete = mainReason && additionalDetails && description;
    
    console.log('Проверка формы:', { mainReason, additionalDetails, description: description?.substring(0, 20), isComplete });
    
    if (tg && tg.MainButton) {
        if (isComplete) {
            tg.MainButton.show();
            console.log('MainButton показана');
        } else {
            tg.MainButton.hide();
            console.log('MainButton скрыта');
        }
    }
    
    return isComplete;
}

// Отправка данных через Telegram WebApp
function sendDataToTelegram(formData) {
    console.log('=== НАЧАЛО ОТПРАВКИ ДАННЫХ ===');
    console.log('formData:', formData);
    console.log('tg exists:', !!tg);
    console.log('tg.sendData exists:', !!(tg && tg.sendData));
    
    if (tg && tg.sendData) {
        try {
            const dataString = JSON.stringify(formData);
            console.log('JSON string:', dataString);
            console.log('JSON string length:', dataString.length);
            
            // Отправляем данные в бот
            console.log('Вызываем tg.sendData()...');
            tg.sendData(dataString);
            console.log('✅ tg.sendData() вызван успешно!');
            
            // НЕ закрываем WebApp сразу - пусть Telegram сам закроет после получения данных
            console.log('Данные отправлены, ждем закрытия от Telegram...');
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка отправки через Telegram WebApp:', error);
            alert('Ошибка отправки: ' + error.message);
            return false;
        }
    } else {
        console.error('❌ Telegram WebApp недоступен или sendData не существует');
        console.log('tg:', tg);
        alert('Telegram WebApp недоступен. Откройте форму через бота.');
        return false;
    }
}

// Функция для получения вложенного значения из объекта
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
}

// Функция для применения текстов к элементам
function applyTexts() {
    console.log('Применяем тексты...');
    
    document.querySelectorAll('[data-text]').forEach(element => {
        const textKey = element.getAttribute('data-text');
        const text = getNestedValue(texts, textKey);
        if (text) {
            element.textContent = text;
        }
    });

    document.querySelectorAll('[data-placeholder]').forEach(element => {
        const placeholderKey = element.getAttribute('data-placeholder');
        const placeholder = getNestedValue(texts, placeholderKey);
        if (placeholder) {
            element.placeholder = placeholder;
        }
    });
}

// Функция для заполнения основных причин
function populateMainReasons() {
    const mainReasonSelect = document.getElementById('mainReason');
    const defaultOption = mainReasonSelect.querySelector('option[value=""]');
    
    mainReasonSelect.innerHTML = '';
    if (defaultOption) {
        mainReasonSelect.appendChild(defaultOption);
    }
    
    Object.entries(texts.main_reasons || {}).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value;
        mainReasonSelect.appendChild(option);
    });
}

// Функция для заполнения деталей
function populateDetails() {
    const additionalDetailsSelect = document.getElementById('additionalDetails');
    const defaultOption = additionalDetailsSelect.querySelector('option[value=""]');
    
    additionalDetailsSelect.innerHTML = '';
    if (defaultOption) {
        additionalDetailsSelect.appendChild(defaultOption);
    }
    
    Object.entries(texts.details || {}).forEach(([category, details]) => {
        Object.entries(details).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value;
            option.setAttribute('data-category', category);
            option.style.display = 'none';
            additionalDetailsSelect.appendChild(option);
        });
    });
}

// Определение путей к JSON
function getJsonPaths() {
    const currentPath = window.location.pathname;
    console.log('Текущий путь:', currentPath);
    
    if (currentPath.includes('/docs/')) {
        return ['static/texts.json', './static/texts.json'];
    } else if (currentPath.endsWith('/') || currentPath.includes('github.io')) {
        return ['static/texts.json', './static/texts.json', `/static/texts.json`];
    } else {
        return ['static/texts.json', './static/texts.json', '../static/texts.json', '/static/texts.json'];
    }
}

// Загрузка текстов из JSON
async function loadTexts() {
    const possiblePaths = getJsonPaths();
    
    for (const path of possiblePaths) {
        try {
            console.log(`Пробуем загрузить: ${path}`);
            const response = await fetch(path);
            
            if (response.ok) {
                texts = await response.json();
                console.log('✅ Тексты загружены из:', path);
                
                applyTexts();
                populateMainReasons();
                populateDetails();
                
                return;
            }
        } catch (error) {
            console.log(`Не удалось загрузить из ${path}:`, error.message);
            continue;
        }
    }

    console.error('❌ Не удалось загрузить тексты');
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ИНИЦИАЛИЗАЦИЯ WEBAPP ===');
    console.log('DOM загружен');
    console.log('URL:', window.location.href);
    console.log('Telegram WebApp object:', tg);
    
    // Инициализируем Telegram WebApp
    const isTelegramWebApp = initTelegramWebApp();
    console.log('isTelegramWebApp:', isTelegramWebApp);
    
    loadTexts();
    
    const mainReasonSelect = document.getElementById('mainReason');
    const additionalDetailsSelect = document.getElementById('additionalDetails');
    const form = document.getElementById('problemForm');
    const descriptionTextarea = document.getElementById('description');

    // Обработчики изменения полей
    [mainReasonSelect, additionalDetailsSelect, descriptionTextarea].forEach(element => {
        element.addEventListener('input', checkFormCompleteness);
        element.addEventListener('change', checkFormCompleteness);
    });

    // Обработка изменения основной причины
    mainReasonSelect.addEventListener('change', function() {
        const selectedReason = this.value;
        
        const allOptions = additionalDetailsSelect.querySelectorAll('option[data-category]');
        allOptions.forEach(option => {
            option.style.display = 'none';
            option.selected = false;
        });
        
        if (selectedReason) {
            additionalDetailsSelect.disabled = false;
            
            const categoryOptions = additionalDetailsSelect.querySelectorAll(`option[data-category="${selectedReason}"]`);
            categoryOptions.forEach(option => {
                option.style.display = 'block';
            });
            
            const selectDetailsText = getNestedValue(texts, 'placeholders.select_details') || 'Выберите детали';
            additionalDetailsSelect.options[0].textContent = selectDetailsText;
            additionalDetailsSelect.value = '';
        } else {
            additionalDetailsSelect.disabled = true;
            const firstSelectText = getNestedValue(texts, 'placeholders.first_select_reason') || 'Сначала выберите основную причину';
            additionalDetailsSelect.options[0].textContent = firstSelectText;
            additionalDetailsSelect.value = '';
        }
        
        checkFormCompleteness();
    });

    // Обработка отправки формы (для обычного режима)
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submit event');
        handleFormSubmit();
    });
    
    // Обработка нажатия главной кнопки Telegram
    if (tg && tg.MainButton) {
        console.log('Устанавливаем обработчик MainButton.onClick');
        tg.MainButton.onClick(function() {
            console.log('MainButton clicked!');
            handleFormSubmit();
        });
    }
    
    function handleFormSubmit() {
        console.log('=== ОБРАБОТКА ОТПРАВКИ ФОРМЫ ===');
        
        const jsonFields = texts.json_fields || {};
        
        const formData = {};
        formData[jsonFields.main_reason || "Основная причина проблемы"] = mainReasonSelect.options[mainReasonSelect.selectedIndex].text;
        formData[jsonFields.additional_explanation || "Дополнительное объяснение"] = additionalDetailsSelect.options[additionalDetailsSelect.selectedIndex].text;
        formData[jsonFields.text || "Текст"] = descriptionTextarea.value;
        formData.timestamp = new Date().toISOString();
        
        console.log('Подготовленные данные формы:', formData);
        
        // Отправляем данные
        const success = sendDataToTelegram(formData);
        console.log('Результат отправки:', success);
    }
    
    // Начальная проверка
    checkFormCompleteness();
    
    console.log('=== ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА ===');
});
