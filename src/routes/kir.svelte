<script>

</script>


<div class="wall container">
    <div class="row">
    <div class="rock">אני מאמין באמונה שלמה בביאת המשיח! ואף על פי שימהמה עם כל זה אחכה לו בכל יום שיבוא.</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
        <div class="rock">a</div>

    </div>
    <div class="row">
    <div class="rock">a</div>
        <div class="rock">a</div>
            <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    </div>
    <div class="row">
    <div class="rock">a</div>
        <div class="rock">a</div>
            <div class="rock">a</div>

    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    </div><div class="row">
    <div class="rock">a</div>
        <div class="rock">a</div>
            <div class="rock">a</div>
    <div class="rock">a</div>

    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    </div><div class="row">
    <div class="rock">a</div>
        <div class="rock">a</div>
            <div class="rock">a</div>

    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    </div>
    <div class="row">
    <div class="rock">a</div>
        <div class="rock">a</div>
            <div class="rock">a</div>
    <div class="rock">a</div>

    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    </div>
<div class="row">
    <div class="rock">a</div>
        <div class="rock">a</div>
            <div class="rock">a</div>

    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    </div>
    <div class="row">
    <div class="rock">a</div>
        <div class="rock">a</div>
            <div class="rock">a</div>
    <div class="rock">a</div>

    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    </div>
    <div class="row">
    <div class="rock">a</div>
        <div class="rock">a</div>
            <div class="rock">a</div>

    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    </div>
    <div class="row">
    <div class="rock">a</div>
        <div class="rock">a</div>
            <div class="rock">a</div>
    <div class="rock">a</div>

    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    </div>
    <div class="row">
    <div class="rock">a</div>
        <div class="rock">a</div>
            <div class="rock">a</div>

    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    <div class="rock">a</div>
    </div>
   
</div>

<style>
    .container{
        
  width: 100vw;
  background-color: #ccc;
}

.row{
  display: flex;
}

.row:nth-child(even) .rock:first-child, .row:nth-child(even) .rock:last-child{
 width: 5.2vw;
}

.rock{
    overflow: auto;
    text-align: center;
    color: var(--barbi-pink);
    width: 10.8vw;
  height: 50px;
  background-color: var(--gold);
  border-radius: 5px;
  margin: 0.2vw;
}
.rock:hover{
    transform: scale( 1.5);
    border: 3px solid var(--mturk);
}
.row .rock:first-child:hover{
  transform: scale( 1.5) translateX(1.8vw);
}
 .row .rock:last-child:hover{
  transform: scale( 1.5) translateX(-1.8vw);
}
.row:first-child .rock:hover{
  transform: scale( 1.5) translateY(8.5px);
}
.row:nth-child(even) .rock:first-child:hover{
  transform: scale( 1.5) translateX(1vw);
}
 .row:nth-child(even) .rock:last-child:hover{
  transform: scale( 1.5) translateX(-1vw);
}
.row:first-child .rock:first-child:hover{
  transform: scale( 1.5) translateX(1.8vw) translateY(8.5px);
}
 .row:first-child .rock:last-child:hover{
  transform: scale( 1.5) translateX(-1.8vw) translateY(8.5px);
}
</style>