var util = {
    get_report_time: function () // 获取简报时间信息
    {
        var t = java.util.Calendar.getInstance();
        return { year2: t.get(java.util.Calendar.YEAR), month2: t.get(java.util.Calendar.MONTH) - 1, year: 2015, month: 6 };
    }
};