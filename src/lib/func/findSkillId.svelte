<script context="module">
    export function find_skill_id(skill_name_arr,skills2,valc) {
    var arr = [];
    for (let j = 0; j < skill_name_arr.length; j++) {
        for (let i = 0; i < skills2.length; i++) {
            if (skills2[i].attributes[valc] === skill_name_arr[j]) {
                arr.push(skills2[i].id);
            }
        }
    }
    return arr;
};
</script>